// Frontend/src/components/Deals/DealsGroupBy.jsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useDealsGroupBy = (groupBy, stages, users, deals) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // Get columns based on groupBy selection
  const columns = useMemo(() => {
    switch (groupBy) {
      case 'stage':
        return stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          color: stage.color || '#6B7280'
        }));

      case 'user':
        return users.map(user => ({
          id: user.id,
          name: user.name,
          color: '#3B82F6'
        }));

      case 'tags':
        // Extract unique tags from all deals
        const tagMap = new Map();
        deals.forEach(deal => {
          deal.tags?.forEach(tag => {
            if (!tagMap.has(tag.id)) {
              tagMap.set(tag.id, {
                id: tag.id,
                name: currentLang === 'ar' && tag.nameAr ? tag.nameAr : tag.name,
                color: tag.color || '#8B5CF6'
              });
            }
          });
        });
        return Array.from(tagMap.values());

      case 'date':
        return [
          { id: 'overdue', name: t('deals.groupBy.overdue'), color: '#EF4444' },
          { id: 'thisWeek', name: t('deals.groupBy.thisWeek'), color: '#F59E0B' },
          { id: 'thisMonth', name: t('deals.groupBy.thisMonth'), color: '#10B981' },
          { id: 'later', name: t('deals.groupBy.later'), color: '#6B7280' }
        ];

      case 'probability':
        return [
          { id: '0-25', name: '0-25%', color: '#EF4444' },
          { id: '26-50', name: '26-50%', color: '#F59E0B' },
          { id: '51-75', name: '51-75%', color: '#3B82F6' },
          { id: '76-100', name: '76-100%', color: '#10B981' }
        ];

      default:
        return stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          color: stage.color || '#6B7280'
        }));
    }
  }, [groupBy, stages, users, deals, t, currentLang]);

  // Get deals by column ID
  const getDealsByColumn = useMemo(() => {
    return (columnId) => {
      switch (groupBy) {
        case 'stage':
          return deals.filter(deal => deal.stageId === columnId);

        case 'user':
          return deals.filter(deal => deal.assignedTo === columnId);

        case 'tags':
          return deals.filter(deal =>
            deal.tags?.some(tag => tag.id === columnId)
          );

        case 'date':
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const weekEnd = new Date(today);
          weekEnd.setDate(today.getDate() + 7);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

          return deals.filter(deal => {
            const closeDate = new Date(deal.expectedCloseDate);

            switch (columnId) {
              case 'overdue':
                return closeDate < today;
              case 'thisWeek':
                return closeDate >= today && closeDate <= weekEnd;
              case 'thisMonth':
                return closeDate > weekEnd && closeDate <= monthEnd;
              case 'later':
                return closeDate > monthEnd;
              default:
                return false;
            }
          });

        case 'probability':
          return deals.filter(deal => {
            const prob = parseInt(deal.probability) || 0;

            switch (columnId) {
              case '0-25':
                return prob >= 0 && prob <= 25;
              case '26-50':
                return prob >= 26 && prob <= 50;
              case '51-75':
                return prob >= 51 && prob <= 75;
              case '76-100':
                return prob >= 76 && prob <= 100;
              default:
                return false;
            }
          });

        default:
          return deals.filter(deal => deal.stageId === columnId);
      }
    };
  }, [groupBy, deals]);

  return { columns, getDealsByColumn };
};
