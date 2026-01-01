import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigation } from "../hooks/useNavigation";
import { useTelegram } from "../hooks/useTelegram";
import { habitService } from "../services/habits";
import Loader from "../components/common/Loader";
import DeleteConfirmModal from "../components/modals/DeleteConfirmModal";
import CopyLinkModal from "../components/modals/CopyLinkModal";
import Toast from "../components/common/Toast";
import SubscriptionModal from "../components/modals/SubscriptionModal";
import "./HabitDetail.css";
import FriendSwipeHint from "../components/habits/FriendSwipeHint";
import { useTranslation } from "../hooks/useTranslation";
import { useTelegramTheme } from "../hooks/useTelegramTheme";

const CircularProgress = ({ value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="var(--bg-tertiary, #F2F2F7)"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
};

const HabitDetail = ({ habit, onClose, onEdit, onDelete }) => {
  const { tg, user: currentUser } = useTelegram();
  const { t } = useTranslation();

  // ✅ КРИТИЧНО: Мемоизируем onClose чтобы предотвратить лишние ре-рендеры useNavigation
  const stableOnClose = useCallback(() => {
    console.log("🔙 HabitDetail closing");
    onClose();
  }, [onClose]);

  // ✅ Используем useNavigation ПОСЛЕ мемоизации callback
  useNavigation(stableOnClose);
  useTelegramTheme();

  // 🎯 Группируем связанные состояния в объекты для уменьшения количества useState
  const [uiState, setUiState] = useState({
    loading: true,
    ownerInfoLoading: true,
    showDeleteModal: false,
    showCopyModal: false,
    showSubscriptionModal: false,
    showFriendHint: false,
  });

  const [dataState, setDataState] = useState({
    members: [],
    toast: null,
    friendLimitData: null,
    ownerInfo: null,
    isCreator: false,
  });

  const [statistics, setStatistics] = useState({
    currentStreak: 0,
    weekDays: 0,
    weekTotal: 7,
    monthDays: 0,
    monthTotal: 30,
    yearDays: 0,
    yearTotal: 365,
  });

  // 🆕 ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ СТАТИСТИКИ
  const loadStatistics = useCallback(
    async (forceRefresh = false) => {
      try {
        console.log(
          `📊 Loading statistics for habit ${habit.id}, forceRefresh:`,
          forceRefresh
        );

        const stats = forceRefresh
          ? await habitService.getHabitStatistics(habit.id, true)
          : await habitService.getHabitStatistics(habit.id);

        if (stats) {
          setStatistics({
            currentStreak: stats.currentStreak || habit.streak_current || 0,
            weekDays: stats.weekCompleted || 0,
            weekTotal: 7,
            monthDays: stats.monthCompleted || 0,
            monthTotal: stats.monthTotal || 30,
            yearDays: stats.yearCompleted || 0,
            yearTotal: 365,
          });

          console.log("✅ Statistics updated:", {
            currentStreak: stats.currentStreak,
            weekDays: stats.weekCompleted,
            monthDays: stats.monthCompleted,
            yearDays: stats.yearCompleted,
          });
        }
      } catch (error) {
        console.error("Failed to load statistics:", error);
      } finally {
        setUiState((prev) => ({ ...prev, loading: false }));
      }
    },
    [habit.id, habit.streak_current]
  );

  // 🆕 СЛУШАТЕЛЬ ИЗМЕНЕНИЙ В localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.includes("cache_habits")) {
        console.log("🔄 Habit cache changed, refreshing statistics...");
        loadStatistics(true);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadStatistics]);

  // 🆕 СЛУШАТЕЛЬ VISIBILITY
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👀 Page became visible, refreshing statistics...");
        loadStatistics(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadStatistics]);

  // 🆕 ПЕРИОДИЧЕСКОЕ ОБНОВЛЕНИЕ
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("⏰ Auto-refresh statistics (background)");
      loadStatistics(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadStatistics]);

  // После существующего useEffect с loadStatistics
  useEffect(() => {
    const handleHabitStatusChange = (event) => {
      const { habitId, status } = event.detail;

      // Обновляем только если это наша привычка
      if (habitId === habit.id) {
        console.log(
          "🔄 Habit status changed, refreshing statistics immediately..."
        );
        loadStatistics(true); // force refresh
      }
    };

    window.addEventListener("habitStatusChanged", handleHabitStatusChange);

    return () => {
      window.removeEventListener("habitStatusChanged", handleHabitStatusChange);
    };
  }, [habit.id, loadStatistics]);

  // ✅ Вычисление isCreator вынесено в useMemo для оптимизации
  const isCreator = useMemo(() => {
    if (!currentUser) {
      console.warn("⚠️ No current user");
      return false;
    }

    const userDbId = localStorage.getItem("user_id");
    if (!userDbId) {
      console.error("❌ CRITICAL: No user_id in localStorage!");
      return false;
    }

    let creatorStatus = false;

    // Method 1: API ownerInfo
    if (dataState.ownerInfo && dataState.ownerInfo.creator_id) {
      const creatorDbId = String(dataState.ownerInfo.creator_id);
      if (String(userDbId) === creatorDbId) {
        creatorStatus = true;
      }
    }

    // Method 2: habit.creator_id
    if (
      !creatorStatus &&
      habit.creator_id !== undefined &&
      habit.creator_id !== null
    ) {
      const creatorDbId = String(habit.creator_id);
      if (String(userDbId) === creatorDbId) {
        creatorStatus = true;
      }
    }

    // Method 3: habit.user_id fallback
    if (
      !creatorStatus &&
      !habit.parent_habit_id &&
      habit.user_id !== undefined &&
      habit.user_id !== null
    ) {
      const habitUserId = String(habit.user_id);
      if (String(userDbId) === habitUserId) {
        creatorStatus = true;
      }
    }

    console.log("🎯 isCreator calculated:", creatorStatus);
    return creatorStatus;
  }, [
    currentUser,
    dataState.ownerInfo,
    habit.id,
    habit.creator_id,
    habit.user_id,
    habit.parent_habit_id,
  ]);

  // ✅ Объединяем все начальные загрузки в один useEffect
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log("🚀 Initializing HabitDetail data...");

        // Параллельно загружаем все данные
        const [ownerInfo, friendLimit] = await Promise.all([
          habitService.getHabitOwner(habit.id).catch((err) => {
            console.error("Failed to load owner info:", err);
            return null;
          }),
          habitService.checkFriendLimit(habit.id).catch((err) => {
            console.error("Failed to check friend limit:", err);
            return null;
          }),
        ]);

        // Загружаем members отдельно (не критично для первого рендера)
        habitService
          .getHabitMembers(habit.id)
          .then((data) => {
            setDataState((prev) => ({ ...prev, members: data.members || [] }));
          })
          .catch((err) => console.error("Failed to load members:", err));

        // Обновляем состояния одним батчем
        setDataState((prev) => ({
          ...prev,
          ownerInfo,
          friendLimitData: friendLimit,
        }));

        setUiState((prev) => ({ ...prev, ownerInfoLoading: false }));

        // Загружаем статистику
        await loadStatistics(true);

        console.log("✅ HabitDetail data initialized");
      } catch (error) {
        console.error("Failed to initialize data:", error);
        setUiState((prev) => ({
          ...prev,
          loading: false,
          ownerInfoLoading: false,
        }));
      }
    };

    initializeData();
  }, [habit.id, loadStatistics]);

  const loadMembers = async () => {
    try {
      const data = await habitService.getHabitMembers(habit.id);
      setDataState((prev) => ({ ...prev, members: data.members || [] }));
    } catch (error) {
      console.error("Failed to load members:", error);
    }
  };

  const checkFriendLimit = async () => {
    try {
      const limitData = await habitService.checkFriendLimit(habit.id);
      setDataState((prev) => ({ ...prev, friendLimitData: limitData }));
      console.log("Friend limit data:", limitData);
    } catch (error) {
      console.error("Failed to check friend limit:", error);
    }
  };

  const handleAddFriend = async () => {
    console.log("Add Friend clicked, checking limits...");

    const limitCheck = await habitService.checkFriendLimit(habit.id);
    setDataState((prev) => ({ ...prev, friendLimitData: limitCheck }));

    console.log("Friend limit check result:", limitCheck);

    if (limitCheck.showPremiumModal && !limitCheck.isPremium) {
      console.log("Friend limit reached, showing subscription modal");
      setUiState((prev) => ({ ...prev, showSubscriptionModal: true }));
      return;
    }

    await handleShare();
  };

  const handleShare = async () => {
    try {
      const shareData = await habitService.createShareLink(habit.id);
      const shareCode = shareData.shareCode;

      console.log("📤 Creating share link:", {
        habitId: habit.id,
        shareCode,
        botUsername: "CheckHabitlyBot",
      });

      const shareText = `Join my "${habit.title}" habit!\n\n📝 ${t(
        "habitDetail.goal"
      )}: ${habit.goal}\n\nLet's build better habits together! 💪`;

      const shareUrl = `https://t.me/CheckHabitlyBot?start=${shareCode}`;

      console.log("🔗 Generated share URL:", shareUrl);
      console.log("📝 Share text:", shareText);

      const hasSeenFriendHint = localStorage.getItem("hasSeenFriendHint");
      if (!hasSeenFriendHint && dataState.members.length === 0) {
        setTimeout(() => {
          setUiState((prev) => ({ ...prev, showFriendHint: true }));
          localStorage.setItem("hasSeenFriendHint", "true");
        }, 2000);
      }

      if (tg?.openTelegramLink) {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareText)}`;
        console.log("📲 Opening Telegram share dialog:", telegramShareUrl);
        tg.openTelegramLink(telegramShareUrl);
      } else {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareText)}`;
        console.log("🌐 Opening share in browser:", telegramShareUrl);
        window.open(telegramShareUrl, "_blank");
      }

      setDataState((prev) => ({
        ...prev,
        toast: {
          message: t("habitDetail.toasts.shareLinkCreated"),
          type: "success",
        },
      }));

      console.log("✅ Share dialog opened successfully");
    } catch (error) {
      console.error("❌ Failed to create share link:", error);
      setDataState((prev) => ({
        ...prev,
        toast: {
          message: t("habitDetail.toasts.shareLinkFailed"),
          type: "error",
        },
      }));
    }
  };

  const handleSubscriptionContinue = async (plan) => {
    console.log("Selected subscription plan:", plan);

    try {
      const result = await habitService.activatePremium(plan);

      if (result.success) {
        console.log("Premium activated successfully");

        await checkFriendLimit();
        await loadMembers();

        setUiState((prev) => ({ ...prev, showSubscriptionModal: false }));

        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert(
            t("habitDetail.toasts.premiumActivated")
          );
        }

        setTimeout(() => {
          handleShare();
        }, 500);
      }
    } catch (error) {
      console.error("Failed to activate premium:", error);

      setUiState((prev) => ({ ...prev, showSubscriptionModal: false }));

      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(t("habitDetail.toasts.premiumFailed"));
      } else {
        alert(t("habitDetail.toasts.premiumFailed"));
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      console.log("📋 Creating share link for habit:", habit.id);

      const shareData = await habitService.createShareLink(habit.id);
      console.log("✅ Share data received:", shareData);

      if (!shareData || !shareData.shareCode) {
        throw new Error("No share code received");
      }

      const shareCode = shareData.shareCode;
      const inviteLink = `https://t.me/CheckHabitlyBot?start=${shareCode}`;

      console.log("📋 Attempting to copy link:", inviteLink);

      const copySuccess = await copyToClipboard(inviteLink);

      if (copySuccess) {
        console.log("✅ Link copied successfully:", inviteLink);

        setUiState((prev) => ({ ...prev, showCopyModal: true }));

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      } else {
        throw new Error("All copy methods failed");
      }
    } catch (err) {
      console.error("❌ Failed to copy link:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
      });

      setDataState((prev) => ({
        ...prev,
        toast: {
          message: t("habitDetail.toasts.linkCopyFailed"),
          type: "error",
        },
      }));
    }
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        console.log("✅ Copied via Clipboard API");
        return true;
      } catch (err) {
        console.warn("⚠️ Clipboard API failed:", err);
      }
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;

      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      textArea.setSelectionRange(0, 99999);

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        console.log("✅ Copied via execCommand");
        return true;
      }
    } catch (err) {
      console.warn("⚠️ execCommand failed:", err);
    }

    const tg = window.Telegram?.WebApp;
    if (tg && tg.readTextFromClipboard) {
      try {
        if (window.prompt) {
          window.prompt("Copy this link:", text);
          console.log("✅ Showed prompt for manual copy");
          return true;
        }
      } catch (err) {
        console.warn("⚠️ Telegram readTextFromClipboard failed:", err);
      }
    }

    if (tg && tg.showAlert) {
      tg.showAlert(`Copy this link:\n\n${text}`);
      console.log("✅ Showed alert with link");
      return true;
    }

    console.error("❌ All copy methods failed");
    return false;
  };

  const handlePunchFriend = async (memberId) => {
    try {
      const result = await habitService.punchFriend(habit.id, memberId);

      if (result.showToast) {
        setDataState((prev) => ({
          ...prev,
          toast: {
            message: result.toastMessage,
            type: result.toastType || "info",
          },
        }));

        if (window.Telegram?.WebApp?.HapticFeedback) {
          if (result.alreadyCompleted) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred(
              "warning"
            );
          } else if (result.success) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
          }
        }
      } else if (tg?.showAlert) {
        if (result.alreadyCompleted) {
          tg.showAlert(
            t("habitDetail.alerts.alreadyCompleted", {
              name: result.friendName,
            })
          );
        } else if (result.isSkipped) {
          tg.showAlert(
            t("habitDetail.alerts.skipped", { name: result.friendName })
          );
        } else if (result.success) {
          tg.showAlert(t("habitDetail.alerts.reminderSent"));
        }
      }
    } catch (error) {
      console.error("Failed to send punch:", error);
      setDataState((prev) => ({
        ...prev,
        toast: {
          message: t("habitDetail.toasts.punchFailed"),
          type: "error",
        },
      }));
    }
  };

  const handleRemoveFriend = async (memberId) => {
    try {
      if (tg?.showConfirm) {
        tg.showConfirm(
          t("habitDetail.alerts.removeFriendConfirm"),
          async (confirmed) => {
            if (confirmed) {
              await habitService.removeMember(habit.id, memberId);
              await loadMembers();
              await checkFriendLimit();
              setDataState((prev) => ({
                ...prev,
                toast: {
                  message: t("habitDetail.toasts.friendRemoved"),
                  type: "success",
                },
              }));
            }
          }
        );
      } else {
        const confirmed = window.confirm(
          t("habitDetail.alerts.removeFriendConfirm")
        );
        if (confirmed) {
          await habitService.removeMember(habit.id, memberId);
          await loadMembers();
          await checkFriendLimit();
          setDataState((prev) => ({
            ...prev,
            toast: {
              message: t("habitDetail.toasts.friendRemoved"),
              type: "success",
            },
          }));
        }
      }
    } catch (error) {
      console.error("Failed to remove friend:", error);
      setDataState((prev) => ({
        ...prev,
        toast: {
          message: t("habitDetail.toasts.friendRemoveFailed"),
          type: "error",
        },
      }));
    }
  };

  const handleEditClick = () => {
    console.log("🖊️ Edit button clicked");
    console.log("✅ User is the creator - opening edit form");

    if (onEdit) {
      onEdit(habit);
    }
  };

  const getCategoryEmoji = () => {
    return habit.category_icon || habit.icon || "🎯";
  };

  const getProgressPercentage = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getProgressColor = (type) => {
    const colors = {
      streak: "#A7D96C",
      week: "#7DD3C0",
      month: "#C084FC",
      year: "#FBBF24",
    };
    return colors[type] || "#A7D96C";
  };

  if (uiState.loading) {
    return (
      <div className="habit-detail habit-detail--loading">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <>
      <div className="habit-detail">
        <div className="habit-detail__content">
          <div className="habit-detail__habit-info">
            <div className="habit-detail__habit-header">
              <div className="habit-detail__habit-title-section">
                <span className="habit-detail__emoji">
                  {getCategoryEmoji()}
                </span>
                <h2 className="habit-detail__habit-title">{habit.title}</h2>
              </div>

              {!uiState.ownerInfoLoading && isCreator && (
                <button
                  className="habit-detail__edit-btn"
                  onClick={handleEditClick}
                >
                  {t("habitDetail.edit")}
                </button>
              )}
            </div>

            {habit.goal && (
              <p className="habit-detail__habit-goal">{habit.goal}</p>
            )}
          </div>

          <div className="habit-detail__statistics">
            <div className="habit-detail__stat-card">
              <div
                className="habit-detail__stat-circle"
                style={{
                  "--progress": getProgressPercentage(
                    statistics.currentStreak,
                    100
                  ),
                  "--color": getProgressColor("streak"),
                }}
              >
                <span className="habit-detail__stat-value">
                  {statistics.currentStreak}
                </span>
              </div>
              <h3 className="habit-detail__stat-title">
                {t("habitDetail.statistics.daysStreak")}
              </h3>
              <p className="habit-detail__stat-subtitle">
                {t("habitDetail.statistics.daysStreak")}
              </p>
            </div>

            <div className="habit-detail__stat-card">
              <div
                className="habit-detail__stat-circle"
                style={{
                  "--progress": getProgressPercentage(
                    statistics.weekDays,
                    statistics.weekTotal
                  ),
                  "--color": getProgressColor("week"),
                }}
              >
                <span className="habit-detail__stat-value">
                  {statistics.weekDays}
                </span>
                <span className="habit-detail__stat-total">
                  {statistics.weekTotal}
                </span>
              </div>
              <h3 className="habit-detail__stat-title">
                {t("habitDetail.statistics.week")}
              </h3>
              <p className="habit-detail__stat-subtitle">
                {t("habitDetail.statistics.daysStreak")}
              </p>
            </div>

            <div className="habit-detail__stat-card">
              <div
                className="habit-detail__stat-circle"
                style={{
                  "--progress": getProgressPercentage(
                    statistics.monthDays,
                    statistics.monthTotal
                  ),
                  "--color": getProgressColor("month"),
                }}
              >
                <span className="habit-detail__stat-value">
                  {statistics.monthDays}
                </span>
                <span className="habit-detail__stat-total">
                  {statistics.monthTotal}
                </span>
              </div>
              <h3 className="habit-detail__stat-title">
                {t("habitDetail.statistics.month")}
              </h3>
              <p className="habit-detail__stat-subtitle">
                {t("habitDetail.statistics.daysStreak")}
              </p>
            </div>

            <div className="habit-detail__stat-card">
              <div
                className="habit-detail__stat-circle"
                style={{
                  "--progress": getProgressPercentage(
                    statistics.yearDays,
                    statistics.yearTotal
                  ),
                  "--color": getProgressColor("year"),
                }}
              >
                <span className="habit-detail__stat-value">
                  {statistics.yearDays}
                </span>
                <span className="habit-detail__stat-total">
                  {statistics.yearTotal}
                </span>
              </div>
              <h3 className="habit-detail__stat-title">
                {t("habitDetail.statistics.year")}
              </h3>
              <p className="habit-detail__stat-subtitle">
                {t("habitDetail.statistics.daysStreak")}
              </p>
            </div>
          </div>

          <div className="habit-detail__motivation">
            <p className="habit-detail__motivation-text">
              {t("habitDetail.motivation")}
            </p>
          </div>

          <div className="habit-detail__friends">
            <h3 className="habit-detail__friends-title">
              {t("habitDetail.friends.title")}
            </h3>

            {dataState.friendLimitData &&
              !dataState.friendLimitData.isPremium && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#8E8E93",
                    marginBottom: "12px",
                    textAlign: "left",
                  }}
                >
                  {dataState.friendLimitData.currentFriendsCount}/
                  {dataState.friendLimitData.limit}{" "}
                  {dataState.friendLimitData.limit === 1
                    ? t("habitDetail.friends.friendsAdded")
                    : t("habitDetail.friends.friendsAddedPlural")}{" "}
                  ({t("habitDetail.friends.freePlan")})
                </p>
              )}

            {dataState.members.length > 0 ? (
              <div className="habit-detail__members-list">
                {dataState.members.map((member) => (
                  <FriendCard
                    key={member.id}
                    member={member}
                    onPunch={() => handlePunchFriend(member.id)}
                    onRemove={() => handleRemoveFriend(member.id)}
                    removeText={t("habitDetail.friends.remove")}
                    punchText={t("habitDetail.friends.punch")}
                  />
                ))}
              </div>
            ) : (
              <p className="habit-detail__friends-subtitle">
                {t("habitDetail.friends.subtitle")}
              </p>
            )}

            <div className="habit-detail__share-buttons">
              <button
                className="habit-detail__btn habit-detail__btn--primary habit-detail__btn--share"
                onClick={handleAddFriend}
              >
                {t("habitDetail.friends.addFriend")}
              </button>
            </div>
          </div>

          {isCreator && (
            <button
              className="habit-detail__btn habit-detail__btn--danger"
              onClick={() =>
                setUiState((prev) => ({ ...prev, showDeleteModal: true }))
              }
            >
              {t("habitDetail.buttons.removeHabit")}
            </button>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={uiState.showDeleteModal}
        onClose={() =>
          setUiState((prev) => ({ ...prev, showDeleteModal: false }))
        }
        onConfirm={() => onDelete(habit.id)}
        habitTitle={habit.title}
      />

      <CopyLinkModal
        isOpen={uiState.showCopyModal}
        onClose={() =>
          setUiState((prev) => ({ ...prev, showCopyModal: false }))
        }
      />

      <FriendSwipeHint
        show={uiState.showFriendHint}
        onClose={() =>
          setUiState((prev) => ({ ...prev, showFriendHint: false }))
        }
      />

      <SubscriptionModal
        isOpen={uiState.showSubscriptionModal}
        onClose={() =>
          setUiState((prev) => ({ ...prev, showSubscriptionModal: false }))
        }
        onContinue={handleSubscriptionContinue}
      />

      {dataState.toast && (
        <Toast
          message={dataState.toast.message}
          type={dataState.toast.type}
          duration={3000}
          onClose={() => setDataState((prev) => ({ ...prev, toast: null }))}
        />
      )}
    </>
  );
};

const FriendCard = React.memo(
  ({ member, onPunch, onRemove, removeText, punchText }) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [startX, setStartX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);

    const SWIPE_THRESHOLD = 60;
    const MAX_SWIPE = 100;

    const handleTouchStart = (e) => {
      setStartX(e.touches[0].clientX);
      setIsSwiping(true);
    };

    const handleTouchMove = (e) => {
      if (!isSwiping) return;

      const currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
      setSwipeOffset(limitedDiff);
    };

    const handleTouchEnd = () => {
      if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
        if (swipeOffset < 0) {
          onPunch();
        } else {
          onRemove();
        }
      }

      setSwipeOffset(0);
      setIsSwiping(false);
    };

    return (
      <div className="friend-card-container">
        {swipeOffset > 20 && (
          <div className="friend-action friend-action--remove">
            <span>{removeText}</span>
          </div>
        )}

        <div
          className="friend-card"
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isSwiping ? "none" : "transform 0.3s ease-out",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={
              member.photo_url ||
              `https://ui-avatars.com/api/?name=${member.first_name}`
            }
            alt={member.first_name}
            className="friend-card__avatar"
          />
          <span className="friend-card__name">
            {member.first_name} {member.last_name}
          </span>
        </div>

        {swipeOffset < -20 && (
          <div className="friend-action friend-action--punch">
            <span>{punchText}</span>
          </div>
        )}
      </div>
    );
  }
);

FriendCard.displayName = "FriendCard";

export default HabitDetail;
