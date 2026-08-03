import { Text } from '../../../ui/Text';
import { workoutCardStyle } from '../../../pages/workoutShared';
import { Thumb } from '../Thumb';
import { PhotoUploadButton } from './PhotoUploadButton';
import type { WorkoutCategory } from '../types';

interface AdminCategoriesTabProps {
  categories: WorkoutCategory[];
  onPhotoUploaded: (categoryId: string, url: string) => void;
}

export function AdminCategoriesTab({ categories, onPhotoUploaded }: AdminCategoriesTabProps) {
  return (
    <>
      {categories.map((cat) => (
        <div
          key={cat._id}
          style={{ ...workoutCardStyle, marginBottom: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Thumb src={cat.imageUrl} alt={cat.name} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text bold style={{ display: 'block' }}>
              {cat.emoji} {cat.name}
            </Text>
            {cat.description && (
              <Text variant="small" muted style={{ display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cat.description}
              </Text>
            )}
          </div>
          <PhotoUploadButton
            compact
            uploadUrl={`/workouts/categories/${cat._id}/photo`}
            onUploaded={(url) => onPhotoUploaded(cat._id, url)}
          />
        </div>
      ))}
    </>
  );
}
