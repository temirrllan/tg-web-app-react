import React, { useState, useRef, useEffect } from "react";
import { HABIT_STATUSES } from "../../utils/constants";
import "./HabitCard.css";
import { useTranslation } from "../../hooks/useTranslation";

const HabitCard = React.memo(
  ({ habit, onMark, onUnmark, readOnly = false, onClick, isLeaving = false }) => {
    const [loading, setLoading] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0); // Добавляем Y координату
    const [isSwiping, setIsSwiping] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false); // Флаг скролла
    const [hasMoved, setHasMoved] = useState(false);
    const cardRef = useRef(null);
    const lastActionRef = useRef(null);
    const { t } = useTranslation();

    const currentStatus = habit.today_status || HABIT_STATUSES.PENDING;
    const isCompleted = currentStatus === HABIT_STATUSES.COMPLETED;
    const isFailed = currentStatus === HABIT_STATUSES.FAILED;
    const isSkipped = currentStatus === HABIT_STATUSES.SKIPPED;
    const isPending = currentStatus === HABIT_STATUSES.PENDING;

    const SWIPE_THRESHOLD = 60;
    const MAX_SWIPE = 120;
    const MOVE_THRESHOLD = 5; // Минимальное движение для начала свайпа
    const SCROLL_THRESHOLD = 10; // Порог для определения скролла

    useEffect(() => {
      setSwipeOffset(0);
    }, [habit.today_status]);

    const getNextStatusLeft = () => {
      switch (currentStatus) {
        case HABIT_STATUSES.PENDING:
        case HABIT_STATUSES.SKIPPED:
          return HABIT_STATUSES.COMPLETED;
        case HABIT_STATUSES.FAILED:
          return HABIT_STATUSES.SKIPPED;
        case HABIT_STATUSES.COMPLETED:
          return null;
        default:
          return null;
      }
    };

    const getNextStatusRight = () => {
      switch (currentStatus) {
        case HABIT_STATUSES.PENDING:
        case HABIT_STATUSES.SKIPPED:
          return HABIT_STATUSES.FAILED;
        case HABIT_STATUSES.COMPLETED:
          return HABIT_STATUSES.SKIPPED;
        case HABIT_STATUSES.FAILED:
          return null;
        default:
          return null;
      }
    };

    const handleSwipeComplete = async (direction) => {
      if (loading) return;

      let nextStatus = null;

      if (direction === "left") {
        nextStatus = getNextStatusLeft();
      } else if (direction === "right") {
        nextStatus = getNextStatusRight();
      }

      if (!nextStatus) {
        setSwipeOffset(0);
        return;
      }

      // 🆕 КРИТИЧНО: Проверяем, не был ли недавно выполнен такой же запрос
      const actionKey = `${habit.id}-${nextStatus}`;
      const now = Date.now();
      
      if (lastActionRef.current === actionKey && (now - lastActionRef.lastTime) < 1000) {
        console.log('⚠️ Duplicate action prevented:', actionKey);
        setSwipeOffset(0);
        return;
      }
      
      lastActionRef.current = actionKey;
      lastActionRef.lastTime = now;

      setLoading(true);
      setIsAnimating(true);

      try {
        if (nextStatus === HABIT_STATUSES.PENDING) {
          await onUnmark(habit.id);
        } else {
          await onMark(habit.id, nextStatus);
        }

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
        }
      } catch (error) {
        console.error("Failed to update habit:", error);
      } finally {
        setLoading(false);
        setIsAnimating(false);
        setSwipeOffset(0);
      }
    };

    // Touch handlers
    const handleTouchStart = (e) => {
      if (loading) return;

      const touch = e.touches[0];
      setStartX(touch.clientX);
      setStartY(touch.clientY);
      setIsSwiping(false);
      setIsScrolling(false);
      setHasMoved(false);
    };

    const handleTouchMove = (e) => {
      if (loading) return;

      const touch = e.touches[0];
      const currentX = touch.clientX;
      const currentY = touch.clientY;

      const diffX = currentX - startX;
      const diffY = currentY - startY;

      // Если еще не определили тип движения
      if (!isSwiping && !isScrolling) {
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        // Определяем направление движения
        if (absX > SCROLL_THRESHOLD || absY > SCROLL_THRESHOLD) {
          if (absY > absX) {
            // Вертикальное движение = скролл
            setIsScrolling(true);
            return;
          } else {
            if (!readOnly) {
              setIsSwiping(true);
            } else {
              setIsScrolling(true); // readOnly = считаем скроллом
            }
          }
        } else {
          return; // Движение слишком маленькое
        }
      }

      // Если это скролл - не обрабатываем
      if (isScrolling) {
        return;
      }

      // Если это свайп - обрабатываем
      if (isSwiping) {
        // Предотвращаем скролл при свайпе
        e.preventDefault();

        setHasMoved(true);

        // Проверяем возможность свайпа
        if (diffX < 0 && !getNextStatusLeft()) return;
        if (diffX > 0 && !getNextStatusRight()) return;

        const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX));
        setSwipeOffset(limitedDiff);
      }
    };

    const handleTouchEnd = () => {
      // Если был скролл - просто сбрасываем флаги
      if (isScrolling) {
        setIsScrolling(false);
        setStartX(0);
        setStartY(0);
        return;
      }

      // Если не было свайпа и не было движения - это клик
      if (!isSwiping && !hasMoved && onClick) {
        onClick(habit);
        setStartX(0);
        setStartY(0);
        return;
      }

      // Если был свайп - обрабатываем
      if (isSwiping) {
        if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
          if (swipeOffset < 0) {
            handleSwipeComplete("left");
          } else {
            handleSwipeComplete("right");
          }
        } else {
          setSwipeOffset(0);
        }
      }

      // Сбрасываем флаги
      setIsSwiping(false);
      setIsScrolling(false);
      setStartX(0);
      setStartY(0);
      setHasMoved(false);
    };

    // Mouse handlers для десктопа
    const handleMouseDown = (e) => {
      if (loading) return;
      e.preventDefault();
      setStartX(e.clientX);
      setStartY(e.clientY);
      setIsSwiping(false);
      setIsScrolling(false);
      setHasMoved(false);
    };

    const handleMouseMove = (e) => {
      if (loading || readOnly || startX === 0) return;

      const currentX = e.clientX;
      const diffX = currentX - startX;

      if (Math.abs(diffX) > MOVE_THRESHOLD) {
        setHasMoved(true);
        setIsSwiping(true);
      }

      if (!isSwiping) return;

      if (diffX < 0 && !getNextStatusLeft()) return;
      if (diffX > 0 && !getNextStatusRight()) return;

      const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX));
      setSwipeOffset(limitedDiff);
    };

    const handleMouseUp = () => {
      if (!isSwiping && !hasMoved && onClick) {
        onClick(habit);
        setStartX(0);
        return;
      }

      if (!isSwiping) {
        setStartX(0);
        return;
      }

      setIsSwiping(false);
      setStartX(0);

      if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
        if (swipeOffset < 0) {
          handleSwipeComplete("left");
        } else {
          handleSwipeComplete("right");
        }
      } else {
        setSwipeOffset(0);
      }
    };

    const handleMouseLeave = () => {
      if (isSwiping) {
        setIsSwiping(false);
        setSwipeOffset(0);
      }
      setStartX(0);
      setStartY(0);
      setHasMoved(false);
    };

    const showLeftButton = swipeOffset < -20 && getNextStatusLeft();
    const showRightButton = swipeOffset > 20 && getNextStatusRight();

    const getLeftButtonInfo = () => {
      const nextStatus = getNextStatusLeft();
      if (!nextStatus) return null;

      switch (nextStatus) {
        case HABIT_STATUSES.COMPLETED:
          return {
            icon: "✓",
            text: t("button.done"),
            className: "done-button",
          };
        case HABIT_STATUSES.SKIPPED:
          return {
            icon: "⟳",
            text: t("button.skip"),
            className: "skip-button",
          };
        default:
          return null;
      }
    };

    const getRightButtonInfo = () => {
      const nextStatus = getNextStatusRight();
      if (!nextStatus) return null;

      switch (nextStatus) {
        case HABIT_STATUSES.FAILED:
          return {
            icon: "✗",
            text: t("button.unDone"),
            className: "undone-button",
          };
        case HABIT_STATUSES.SKIPPED:
          return {
            icon: "⟳",
            text: t("button.skip"),
            className: "skip-button",
          };
        default:
          return null;
      }
    };

    const leftButton = getLeftButtonInfo();
    const rightButton = getRightButtonInfo();

    const getCardState = () => {
      switch (currentStatus) {
        case HABIT_STATUSES.COMPLETED:
          return "completed";
        case HABIT_STATUSES.FAILED:
          return "failed";
        case HABIT_STATUSES.SKIPPED:
          return "";
        default:
          return "";
      }
    };

    const getStatusIcon = () => {
      switch (currentStatus) {
        case HABIT_STATUSES.COMPLETED:
          return "✓";
        case HABIT_STATUSES.FAILED:
          return "✗";
        case HABIT_STATUSES.SKIPPED:
          return "⟳";
        default:
          return null;
      }
    };

    const getCategoryEmoji = () => {
      return habit.category_icon || habit.icon || "🎯";
    };

    const hasMembers = habit.members_count && habit.members_count > 0;

    return (
      <div className={`habit-card-wrapper ${hasMembers ? "has-members" : ""} ${isLeaving ? "habit-card--leaving" : ""}`}>
        <div className="habit-card-container">
          {rightButton && (
            <div
              className={`swipe-action-button ${rightButton.className} ${
                showRightButton ? "visible" : ""
              }`}
              style={{
                left: 0,
                opacity: showRightButton
                  ? Math.min(swipeOffset / SWIPE_THRESHOLD, 1)
                  : 0,
                transform: `scale(${
                  showRightButton
                    ? Math.min(swipeOffset / SWIPE_THRESHOLD, 1)
                    : 0.8
                })`,
              }}
            >
              <span className="swipe-action-icon">{rightButton.icon}</span>
              <span className="swipe-action-text">{rightButton.text}</span>
            </div>
          )}

          <div
            ref={cardRef}
            className={`habit-card ${getCardState()} ${
              isAnimating ? "animating" : ""
            } ${isSwiping ? "swiping" : ""}`}
            style={{
              transform: `translateX(${swipeOffset}px)`,
              transition: isSwiping ? "none" : "transform 0.3s ease-out",
              cursor: onClick ? "pointer" : "grab",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div className="habit-card-content">
              <div className={`habit-icon ${getCardState()}`}>
                <span className="habit-emoji">{getCategoryEmoji()}</span>
              </div>

              <div className="habit-info">
                <h3 className="habit-title">
                  {habit.is_bad_habit && "😈 "}
                  {habit.title}
                </h3>
                <p className="habit-goal">
                  {t("habit.goal")}: {habit.goal}
                </p>
              </div>

              {!isPending && (
                <div className={`status-indicator ${getCardState()}`}>
                  {getStatusIcon()}
                </div>
              )}
            </div>
          </div>

          {leftButton && (
            <div
              className={`swipe-action-button ${leftButton.className} ${
                showLeftButton ? "visible" : ""
              }`}
              style={{
                right: 0,
                opacity: showLeftButton
                  ? Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1)
                  : 0,
                transform: `scale(${
                  showLeftButton
                    ? Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1)
                    : 0.8
                })`,
              }}
            >
              <span className="swipe-action-icon">{leftButton.icon}</span>
              <span className="swipe-action-text">{leftButton.text}</span>
            </div>
          )}
        </div>

        {hasMembers && (
          <div className="habit-members-badge">
            +{habit.members_count} {t("member.members")}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.habit.id === nextProps.habit.id &&
      prevProps.habit.today_status === nextProps.habit.today_status &&
      prevProps.habit.members_count === nextProps.habit.members_count &&
      prevProps.readOnly === nextProps.readOnly &&
      prevProps.isLeaving === nextProps.isLeaving
    );
  }
);

export default HabitCard;