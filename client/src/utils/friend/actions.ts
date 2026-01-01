import { friendService } from "../../services/friend";
import { i18n } from "../../services/i18n";
import { showNotification, showConfirm } from "../notifications";
import { setupFriendPage } from "./setup";

export async function handleAction(action: string, id: number) {
  const actions: Record<string, { fn: () => Promise<any>; success: string; confirm?: { title: string; message: string; confirmText: string } }> = {
    accept: { fn: () => friendService.acceptFriendRequest(id), success: "Friend request accepted!" },
    reject: { fn: () => friendService.rejectFriendRequest(id), success: "Friend request rejected" },
    remove: {
      fn: () => friendService.removeFriend(id),
      success: "Friend removed",
      confirm: { title: i18n.t('friends'), message: i18n.t('confirm_remove_friend'), confirmText: i18n.t('delete') }
    },
    block: {
      fn: () => friendService.blockUser(id),
      success: "User blocked",
      confirm: { title: i18n.t('block_user'), message: i18n.t('confirm_block_user'), confirmText: i18n.t('block') }
    },
    unblock: { fn: () => friendService.unblockUser(id), success: "User unblocked" }
  };

  const config = actions[action];
  if (!config) return;

  if (config.confirm) {
    const confirmed = await showConfirm({ ...config.confirm, cancelText: i18n.t('back') });
    if (!confirmed) return;
  }

  try {
    await config.fn();
    showNotification(config.success, { type: 'success' });
    setupFriendPage();
  } catch {
    showNotification(`Failed to ${action}`, { type: 'error' });
  }
}
