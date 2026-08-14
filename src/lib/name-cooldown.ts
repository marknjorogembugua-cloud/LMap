export const NAME_CHANGE_COOLDOWN_DAYS = 14;

const COOLDOWN_MS = NAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/** Name changes are rate-limited to once every 14 days, counted from the last
 * change — or from account creation if the name has never been changed. */
export function nameChangeEligibility(user: { createdAt: Date; nameUpdatedAt: Date | null }) {
  const since = user.nameUpdatedAt ?? user.createdAt;
  const nextEditableAt = new Date(since.getTime() + COOLDOWN_MS);
  const canEdit = Date.now() >= nextEditableAt.getTime();
  return { canEdit, nextEditableAt };
}
