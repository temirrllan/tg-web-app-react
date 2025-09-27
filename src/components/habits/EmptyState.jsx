import React from 'react';
import './EmptyState.css';
import bear3 from '../../../public/images/bear3.svg?url';
import { useTranslation } from "../../hooks/useTranslation";

const EmptyState = ({ onCreateClick }) => {
    const { t } = useTranslation(); // Добавьте эту строку

  return (
    <div className="empty-state">
      <div className="empty-state__image">
        <img src={bear3} alt="No habits" />
      </div>
      
      <h2 className="empty-state__title">{t("todays.noHabits")}</h2>
      <p className="empty-state__text">
        {t("todays.noHabitsDescription")}<br />
        {t("todays.tapToAddHabit")}
      </p>
    </div>
  );
};

export default EmptyState;