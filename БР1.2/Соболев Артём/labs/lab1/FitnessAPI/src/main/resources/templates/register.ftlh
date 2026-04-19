<#ftl output_format="HTML" strip_whitespace=true>
<#assign appNameValue = appName!"FitnessAPI">
<#assign userNameValue = name!"друг">
<#assign loginUrlValue = loginUrl!"">
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Добро пожаловать в ${appNameValue}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4eee6;
            color: #1c1a18;
            font-family: "Trebuchet MS", "Segoe UI", sans-serif;
        }

        table {
            border-spacing: 0;
        }

        td {
            padding: 0;
        }

        img {
            border: 0;
            display: block;
            line-height: 100%;
            max-width: 100%;
        }

        .shell {
            width: 100%;
            max-width: 620px;
        }

        .card {
            background: #fffdfa;
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 24px 60px rgba(55, 33, 12, 0.12);
        }

        .hero {
            padding: 36px 36px 32px;
            background:
                    radial-gradient(circle at top right, rgba(255, 226, 166, 0.6), transparent 34%),
                    linear-gradient(135deg, #151515 0%, #2e2b28 48%, #ff6b2c 100%);
            color: #fff9f2;
        }

        .hero-kicker {
            display: inline-block;
            padding: 10px 16px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.08);
            color: #ffd6b8;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }

        .hero-title {
            margin: 20px 0 12px;
            font-size: 34px;
            line-height: 1.1;
            font-weight: 700;
        }

        .hero-text {
            margin: 0;
            max-width: 440px;
            color: rgba(255, 249, 242, 0.82);
            font-size: 16px;
            line-height: 1.7;
        }

        .hero-tags {
            margin-top: 24px;
            font-size: 0;
        }

        .hero-tag {
            display: inline-block;
            margin: 0 10px 10px 0;
            padding: 10px 14px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.1);
            color: #fff3e7;
            font-size: 13px;
            font-weight: 600;
        }

        .content {
            padding: 34px 36px 18px;
        }

        .lead {
            margin: 0 0 20px;
            color: #4a433c;
            font-size: 16px;
            line-height: 1.75;
        }

        .panel {
            margin-bottom: 16px;
            padding: 18px 18px 18px 20px;
            border: 1px solid #f0e4d8;
            border-radius: 22px;
            background: linear-gradient(180deg, #fffdfa 0%, #fff7ef 100%);
        }

        .panel-number {
            display: inline-block;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #1f1d1a;
            color: #fff9f2;
            font-size: 14px;
            font-weight: 700;
            line-height: 34px;
            text-align: center;
        }

        .panel-title {
            margin: 14px 0 8px;
            color: #1f1d1a;
            font-size: 20px;
            font-weight: 700;
        }

        .panel-text {
            margin: 0;
            color: #5a5148;
            font-size: 15px;
            line-height: 1.7;
        }

        .accent-box {
            margin: 28px 0 18px;
            padding: 22px 24px;
            border-radius: 24px;
            background: #1e1d1a;
            color: #fff9f2;
        }

        .accent-title {
            margin: 0 0 10px;
            font-size: 22px;
            font-weight: 700;
            line-height: 1.2;
        }

        .accent-text {
            margin: 0;
            color: rgba(255, 249, 242, 0.8);
            font-size: 15px;
            line-height: 1.7;
        }

        .button-wrap {
            padding: 4px 0 28px;
            text-align: left;
        }

        .button {
            display: inline-block;
            padding: 15px 24px;
            border-radius: 16px;
            background: linear-gradient(135deg, #ff8f48 0%, #ff5b2e 100%);
            color: #fffdfa;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
        }

        .footer {
            padding: 0 36px 34px;
            color: #7b7064;
            font-size: 13px;
            line-height: 1.7;
        }

        .footer a {
            color: #d25828;
            text-decoration: none;
        }

        @media only screen and (max-width: 640px) {
            .hero,
            .content,
            .footer {
                padding-left: 22px !important;
                padding-right: 22px !important;
            }

            .hero {
                padding-top: 28px !important;
            }

            .hero-title {
                font-size: 28px !important;
            }

            .panel-title {
                font-size: 18px !important;
            }
        }
    </style>
</head>
<body>
<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    Регистрация завершена. Добро пожаловать в ${appNameValue}, ${userNameValue}.
</div>

<table role="presentation" width="100%" style="width:100%; background-color:#f4eee6;">
    <tr>
        <td align="center" style="padding: 28px 12px 40px;">
            <table role="presentation" class="shell">
                <tr>
                    <td class="card">
                        <div class="hero">
                            <div class="hero-kicker">${appNameValue}</div>
                            <h1 class="hero-title">Регистрация завершена.<br>Пора начинать движение.</h1>
                            <p class="hero-text">
                                Привет, ${userNameValue}! Твой аккаунт уже готов.
                                Всё, что осталось, это собрать свой ритм тренировок и превратить план в устойчивую привычку.
                            </p>
                            <div class="hero-tags">
                                <span class="hero-tag">Первые тренировки</span>
                                <span class="hero-tag">Прогресс по шагам</span>
                                <span class="hero-tag">Фокус на результате</span>
                            </div>
                        </div>

                        <div class="content">
                            <p class="lead">
                                Мы подготовили пространство, где удобно начать без перегруза:
                                выбрать направление, закрепить расписание и постепенно усиливать результат.
                            </p>

                            <div class="panel">
                                <span class="panel-number">01</span>
                                <h2 class="panel-title">Собери базу</h2>
                                <p class="panel-text">
                                    Заполни профиль и отметь свои цели, чтобы рекомендации и структура тренировок
                                    ощущались как персональный маршрут, а не случайный набор действий.
                                </p>
                            </div>

                            <div class="panel">
                                <span class="panel-number">02</span>
                                <h2 class="panel-title">Начни с первого шага</h2>
                                <p class="panel-text">
                                    Не нужен идеальный старт. Достаточно одной качественной тренировки,
                                    чтобы зафиксировать темп и дать телу понятный сигнал: движение началось.
                                </p>
                            </div>

                            <div class="panel">
                                <span class="panel-number">03</span>
                                <h2 class="panel-title">Держи ритм</h2>
                                <p class="panel-text">
                                    Маленькая, но регулярная дисциплина почти всегда выигрывает у редких рывков.
                                    Сильный результат складывается именно из последовательности.
                                </p>
                            </div>

                            <div class="accent-box">
                                <h2 class="accent-title">Твоя цель не где-то впереди. Она начинается сегодня.</h2>
                                <p class="accent-text">
                                    Заходи, выбирай первую тренировку и превращай мотивацию в систему,
                                    которая работает на тебя каждый день.
                                </p>
                            </div>

                            <#if loginUrlValue?has_content>
                                <div class="button-wrap">
                                    <a class="button" href="${loginUrlValue}">Открыть ${appNameValue}</a>
                                </div>
                            </#if>
                        </div>

                        <div class="footer">
                            Это письмо отправлено автоматически после регистрации в ${appNameValue}.<br>
                            Если сообщение пришло по ошибке, его можно просто проигнорировать.
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
