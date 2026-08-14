import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AnalyticsEvent, AnalyticsEventDocument } from './schemas/analytics-event.schema';

const NAME_RE = /^[a-z0-9_:/\-.]{1,64}$/i;
const MAX_BATCH = 25;

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private eventModel: Model<AnalyticsEventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Приём батча событий с клиента. Невалидное молча отбрасываем: аналитика
  // не должна ломать UX и не заслуживает 400-х в консоли пользователя.
  async ingest(userId: string, events: any[]) {
    if (!Array.isArray(events)) return { accepted: 0 };
    const now = Date.now();
    const docs = events
      .slice(0, MAX_BATCH)
      .filter((e) => e && typeof e.name === 'string' && NAME_RE.test(e.name))
      .map((e) => {
        // Клиентскому ts доверяем в пределах суток (офлайн-очередь), иначе — сейчас
        let ts = new Date(e.ts);
        if (!Number.isFinite(ts.getTime()) || Math.abs(now - ts.getTime()) > 24 * 3600_000) {
          ts = new Date(now);
        }
        let props: Record<string, any> | undefined;
        if (e.props && typeof e.props === 'object' && JSON.stringify(e.props).length <= 500) {
          props = e.props;
        }
        return {
          userId,
          name: e.name,
          ts,
          date: ts.toISOString().slice(0, 10),
          props,
        };
      });
    if (docs.length) await this.eventModel.insertMany(docs, { ordered: false });
    return { accepted: docs.length };
  }

  // Сводка для админ-дашборда. Всё считается на лету по событиям за период —
  // при текущих объёмах это дешевле и проще, чем предагрегация.
  async summary(daysRaw?: string) {
    const days = Math.min(90, Math.max(7, Number(daysRaw) || 30));
    const start = new Date(Date.now() - days * 24 * 3600_000);
    const startDate = start.toISOString().slice(0, 10);

    // Уникальные пользователи по дням (основа DAU/WAU/MAU и ретеншна)
    const perDay: Array<{ _id: string; users: string[] }> = await this.eventModel.aggregate([
      { $match: { date: { $gte: startDate } } },
      { $group: { _id: { date: '$date', userId: '$userId' } } },
      { $group: { _id: '$_id.date', users: { $push: { $toString: '$_id.userId' } } } },
      { $sort: { _id: 1 } },
    ]);
    const usersByDate = new Map(perDay.map((d) => [d._id, new Set(d.users)]));

    const today = new Date().toISOString().slice(0, 10);
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(new Date(Date.now() - i * 24 * 3600_000).toISOString().slice(0, 10));
    }

    const dau = dates.map((date) => ({ date, users: usersByDate.get(date)?.size || 0 }));
    const uniqueSince = (sinceDaysAgo: number) => {
      const set = new Set<string>();
      for (let i = 0; i < sinceDaysAgo; i++) {
        const date = new Date(Date.now() - i * 24 * 3600_000).toISOString().slice(0, 10);
        usersByDate.get(date)?.forEach((u) => set.add(u));
      }
      return set.size;
    };

    // Популярность фич: события за период, page_view раскрыт по пути
    const topEvents: Array<{ _id: any; count: number; users: number }> =
      await this.eventModel.aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: {
              name: '$name',
              path: { $cond: [{ $eq: ['$name', 'page_view'] }, '$props.path', null] },
            },
            count: { $sum: 1 },
            usersSet: { $addToSet: '$userId' },
          },
        },
        { $project: { count: 1, users: { $size: '$usersSet' } } },
        { $sort: { count: -1 } },
        { $limit: 25 },
      ]);

    // Регистрации по дням + ретеншн когорт: вернулся ли новичок на следующий
    // день (D1) и был ли активен в течение недели после регистрации (W1)
    const newUsers: Array<{ _id: any; createdAt: Date }> = await this.userModel
      .find({ createdAt: { $gte: start } }, { createdAt: 1 })
      .lean();
    const registrationsByDate = new Map<string, number>();
    let d1Returned = 0;
    let d1Eligible = 0;
    let w1Returned = 0;
    let w1Eligible = 0;
    for (const u of newUsers) {
      const created = u.createdAt.toISOString().slice(0, 10);
      registrationsByDate.set(created, (registrationsByDate.get(created) || 0) + 1);
      const id = String(u._id);
      const dayAfter = (n: number) =>
        new Date(u.createdAt.getTime() + n * 24 * 3600_000).toISOString().slice(0, 10);
      if (dayAfter(1) <= today) {
        d1Eligible++;
        if (usersByDate.get(dayAfter(1))?.has(id)) d1Returned++;
      }
      if (dayAfter(7) <= today) {
        w1Eligible++;
        for (let n = 1; n <= 7; n++) {
          if (usersByDate.get(dayAfter(n))?.has(id)) {
            w1Returned++;
            break;
          }
        }
      }
    }

    return {
      days,
      totalUsers: await this.userModel.countDocuments(),
      dauToday: usersByDate.get(today)?.size || 0,
      wau: uniqueSince(7),
      mau: uniqueSince(30),
      dau,
      registrations: dates.map((date) => ({ date, count: registrationsByDate.get(date) || 0 })),
      retention: {
        d1: d1Eligible ? Math.round((100 * d1Returned) / d1Eligible) : null,
        d1Eligible,
        w1: w1Eligible ? Math.round((100 * w1Returned) / w1Eligible) : null,
        w1Eligible,
      },
      topEvents: topEvents.map((e) => ({
        name: e._id.path ? `page: ${e._id.path}` : e._id.name,
        count: e.count,
        users: e.users,
      })),
    };
  }
}
