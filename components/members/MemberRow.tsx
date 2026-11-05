import { useAppText } from '@/i18n/useAppText';
import type { FarmMember } from '@/lib/farms/members';
import { Button } from '@/components/ui/Button';

type MemberRowProps = { member: FarmMember; isSelf: boolean; onManage: () => void };

export function MemberRow({ member, isSelf, onManage }: MemberRowProps) {
  const t = useAppText();
  const joined = new Date(member.joinedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const name = member.fullName ?? t.common.notSet;

  return (
    <tr className="border-t border-brand-forest-100">
      <td className="px-6 py-4">
        <span className="font-medium text-stone-900">{name}</span>
        {isSelf && <span className="ml-2 rounded-full bg-brand-gold-500/15 px-2 py-0.5 text-xs font-semibold text-brand-forest-900">{t.members.you}</span>}
      </td>
      <td className="px-6 py-4 text-stone-700">{t.roles[member.role]}</td>
      <td className="px-6 py-4 text-stone-700">{joined}</td>
      <td className="px-6 py-4">
        {member.role === 'owner' ? (
          <span className="text-stone-400">-</span>
        ) : (
          <Button variant="secondary" onClick={onManage} className="px-4 py-2">
            {t.members.manage}
          </Button>
        )}
      </td>
    </tr>
  );
}
