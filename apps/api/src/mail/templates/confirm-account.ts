// Письмо «Подтверждение аккаунта». Хранится TS-константой сознательно:
// nest build не копирует не-TS файлы в dist без отдельной настройки, а так
// шаблон гарантированно едет и в dev, и в docker-образ.
//
// Плейсхолдеры: {{USER_NAME}}, {{CONFIRM_URL}} (3 вхождения: кнопка,
// VML-кнопка Outlook, запасная ссылка), {{ASSETS}} (база картинок без
// слэша на конце), {{SUPPORT_EMAIL}}, {{UNSUBSCRIBE_URL}}.
// Картинки: {{ASSETS}}/hero.png (1200×560, показывается как 600×280),
// meal_128.png, workout_128.png, xp-bolt_128.png — лежат в статике web
// (apps/web/public/email/), в письмо идут абсолютными https-ссылками.

export const CONFIRM_ACCOUNT_HTML = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>Подтвердите почту — FlareonFit</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<style type="text/css">
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block}
  body{margin:0!important;padding:0!important;width:100%!important}
  a{color:#7BD98A}
  @media only screen and (max-width:620px){
    .wrap{width:100%!important}
    .px{padding-left:20px!important;padding-right:20px!important}
    .h1{font-size:24px!important;line-height:32px!important}
    .hero-img{width:100%!important;height:auto!important}
    .stack{display:block!important;width:100%!important;padding:0 0 14px 0!important}
    .btn a{display:block!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#08151F;">

<!-- прехедер: виден в списке писем, в теле скрыт -->
<div style="display:none;font-size:1px;color:#08151F;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Один клик — и аккаунт активен. Ссылка действует 24 часа.
  &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#08151F;">
<tr><td align="center" style="padding:28px 12px;">

  <!-- ── контейнер 600 ── -->
  <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

    <!-- логотип -->
    <tr><td align="center" style="padding:0 0 18px 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <span style="font-size:19px;font-weight:700;color:#FDECDC;letter-spacing:.2px;">Flareon<span style="color:#4CB558;">Fit</span></span>
    </td></tr>

    <!-- ── карточка ── -->
    <tr><td style="background-color:#122A3E;border-radius:24px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

        <!-- герой -->
        <tr><td align="center" bgcolor="#0D2231" style="background-color:#0D2231;line-height:0;">
          <img src="{{ASSETS}}/hero.png" alt="Маскот FlareonFit — лис с гантелей" width="600" height="280"
               class="hero-img" style="display:block;width:600px;max-width:100%;height:auto;border:0;">
        </td></tr>

        <!-- зелёная полоса-акцент -->
        <tr><td height="4" bgcolor="#4CB558" style="height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>

        <!-- текст -->
        <tr><td class="px" align="center" style="padding:30px 40px 0 40px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <div style="display:inline-block;padding:6px 14px;background-color:#16324A;border-radius:999px;
                      font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7BD98A;">
            Аккаунт создан
          </div>
          <h1 class="h1" style="margin:16px 0 0 0;font-size:28px;line-height:36px;font-weight:800;color:#FFFFFF;">
            Привет, {{USER_NAME}}!
          </h1>
          <p style="margin:12px 0 0 0;font-size:16px;line-height:25px;color:#A9BFD0;">
            Осталось подтвердить почту — и дневник, тренировки и лига в твоём распоряжении.
          </p>
        </td></tr>

        <!-- кнопка -->
        <tr><td class="px" align="center" style="padding:26px 40px 0 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn"><tr><td align="center"
              style="border-radius:16px;background-color:#4CB558;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
              href="{{CONFIRM_URL}}" style="height:54px;v-text-anchor:middle;width:340px;" arcsize="30%" stroke="f" fillcolor="#4CB558">
              <w:anchorlock/>
              <center style="color:#06210C;font-family:'Segoe UI',Arial,sans-serif;font-size:17px;font-weight:bold;">Подтвердить почту</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="{{CONFIRM_URL}}" target="_blank"
               style="display:inline-block;padding:17px 44px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                      font-size:17px;font-weight:700;color:#06210C;text-decoration:none;border-radius:16px;background-color:#4CB558;">
              Подтвердить почту
            </a>
            <!--<![endif]-->
          </td></tr></table>
          <p style="margin:14px 0 0 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#7D93A6;">
            Ссылка действует 24 часа
          </p>
        </td></tr>

        <!-- разделитель -->
        <tr><td class="px" style="padding:26px 40px 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td height="1" bgcolor="#22405A" style="height:1px;line-height:1px;font-size:0;">&nbsp;</td>
          </tr></table>
        </td></tr>

        <!-- что дальше -->
        <tr><td class="px" style="padding:24px 40px 0 40px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:#6E8CA3;padding-bottom:14px;">
            Что дальше
          </div>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="44" valign="top" style="padding:0 14px 16px 0;">
                <img src="{{ASSETS}}/meal_128.png" width="34" height="34" alt="" style="display:block;width:34px;height:34px;">
              </td>
              <td valign="top" style="padding:0 0 16px 0;font-size:15px;line-height:22px;color:#CBD9E4;">
                <b style="color:#FFFFFF;">Запиши первый приём пищи</b><br>
                <span style="color:#93AABD;">Или сфотографируй тарелку — ИИ посчитает КБЖУ сам</span>
              </td>
            </tr>
            <tr>
              <td width="44" valign="top" style="padding:0 14px 16px 0;">
                <img src="{{ASSETS}}/workout_128.png" width="34" height="34" alt="" style="display:block;width:34px;height:34px;">
              </td>
              <td valign="top" style="padding:0 0 16px 0;font-size:15px;line-height:22px;color:#CBD9E4;">
                <b style="color:#FFFFFF;">Заверши тренировку</b><br>
                <span style="color:#93AABD;">Готовые программы или своя — как удобнее</span>
              </td>
            </tr>
            <tr>
              <td width="44" valign="top" style="padding:0 14px 0 0;">
                <img src="{{ASSETS}}/xp-bolt_128.png" width="34" height="34" alt="" style="display:block;width:34px;height:34px;">
              </td>
              <td valign="top" style="font-size:15px;line-height:22px;color:#CBD9E4;">
                <b style="color:#FFFFFF;">Забери первые XP</b><br>
                <span style="color:#93AABD;">И займи место в недельной лиге</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- запасная ссылка -->
        <tr><td class="px" style="padding:26px 40px 32px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="background-color:#0E2234;border-radius:14px;">
            <tr><td style="padding:16px 18px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                           font-size:13px;line-height:21px;color:#7D93A6;">
              Кнопка не работает? Скопируй ссылку в браузер:<br>
              <a href="{{CONFIRM_URL}}" style="color:#7BD98A;word-break:break-all;text-decoration:underline;">{{CONFIRM_URL}}</a>
            </td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>

    <!-- подвал -->
    <tr><td class="px" align="center" style="padding:22px 24px 0 24px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                                             font-size:12.5px;line-height:20px;color:#63809A;">
      Если аккаунт создавал не ты — просто удали это письмо, ничего не произойдёт.
    </td></tr>
    <tr><td align="center" style="padding:14px 24px 0 24px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                                  font-size:12.5px;line-height:20px;color:#4F6A82;">
      FlareonFit · <a href="mailto:{{SUPPORT_EMAIL}}" style="color:#63809A;text-decoration:underline;">{{SUPPORT_EMAIL}}</a>
      · <a href="{{UNSUBSCRIBE_URL}}" style="color:#63809A;text-decoration:underline;">Отписаться</a>
    </td></tr>
    <tr><td height="28" style="height:28px;line-height:28px;font-size:0;">&nbsp;</td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

// Текстовая версия обязательна: multipart-письма реже попадают в спам
export const CONFIRM_ACCOUNT_TEXT = `Привет, {{USER_NAME}}!

Аккаунт в FlareonFit создан. Осталось подтвердить почту:

{{CONFIRM_URL}}

Ссылка действует 24 часа.

Что дальше:
— Запиши первый приём пищи или сфотографируй тарелку, ИИ посчитает КБЖУ
— Заверши тренировку: готовые программы или своя
— Забери первые XP и займи место в недельной лиге

Если аккаунт создавал не ты — просто удали это письмо, ничего не произойдёт.

FlareonFit · {{SUPPORT_EMAIL}}
Отписаться: {{UNSUBSCRIBE_URL}}`;
