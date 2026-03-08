import React from 'react';
import bearImg from '../../../public/images/bear.png';
import './BoredBear.css';

const BoredBear = () => {
  return (
    <div className="bored-bear">
      <div className="bored-bear__container">
        <div className="bored-bear__shadow" />
        <img
          src={bearImg}
          alt="Bored bear"
          className="bored-bear__image"
        />
        <div className="bored-bear__zzz">
          <span className="bored-bear__z bored-bear__z--1">z</span>
          <span className="bored-bear__z bored-bear__z--2">z</span>
          <span className="bored-bear__z bored-bear__z--3">z</span>
        </div>
      </div>
      <h2 className="bored-bear__title">Пока здесь пусто...</h2>
      <p className="bored-bear__text">
        Мишке скучно без привычек!<br />
        Добавьте первую, чтобы его подбодрить 🐻
      </p>
    </div>
  );
};

export default BoredBear;
