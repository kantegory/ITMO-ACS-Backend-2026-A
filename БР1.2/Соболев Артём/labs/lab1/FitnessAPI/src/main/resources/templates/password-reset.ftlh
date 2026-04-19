<#ftl output_format="HTML" strip_whitespace=true>
<#assign appNameValue = appName!"FitnessAPI">
<#assign userNameValue = name!"друг">
<#assign resetUrlValue = resetUrl!"">
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Сброс пароля в ${appNameValue}</title>
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
    Запрос на сброс пароля в ${appNameValue} для ${userNameValue}.
</div>

<table role="presentation" width="100%" style="width:100%; background-color:#f4eee6;">
    <tr>
        <td align="center" style="padding: 28px 12px 40px;">
            <table role="presentation" class="shell">
                <tr>
                    <td class="card">
                        <div class="hero">
                            <div class="hero-kicker">${appNameValue}</div>
                            <h1 class="hero-title">Сброс пароля.<br>Восстановим доступ спокойно.</h1>
                            <p class="hero-text">
                                Привет, ${userNameValue}! Мы получили запрос на изменение пароля.
                                Если это был ты, подтверди действие по ссылке ниже и задай новый пароль для аккаунта.
                            </p>
                            <div class="hero-tags">
                                <span class="hero-tag">Безопасный вход</span>
                                <span class="hero-tag">Быстрое восстановление</span>
                                <span class="hero-tag">Контроль доступа</span>
                            </div>
                        </div>

                        <div class="content">
                            <p class="lead">
                                Ниже коротко собрали, как проходит восстановление доступа.
                                Процесс займёт всего пару шагов и поможет быстро вернуться в ${appNameValue}.
                            </p>

                            <div class="panel">
                                <span class="panel-number">01</span>
                                <h2 class="panel-title">Открой ссылку из письма</h2>
                                <p class="panel-text">
                                    Нажми на кнопку ниже, чтобы перейти на страницу сброса пароля.
                                    Ссылка ведёт к защищённой форме, где можно безопасно задать новый пароль.
                                </p>
                            </div>

                            <div class="panel">
                                <span class="panel-number">02</span>
                                <h2 class="panel-title">Установи новый пароль</h2>
                                <p class="panel-text">
                                    Выбери надёжный пароль, который не использовался ранее и который легко
                                    хранить в менеджере паролей, а не в заметках или переписках.
                                </p>
                            </div>

                            <div class="panel">
                                <span class="panel-number">03</span>
                                <h2 class="panel-title">Игнорируй письмо, если это не ты</h2>
                                <p class="panel-text">
                                    Если запрос сделал не ты, ничего не подтверждай. Текущий пароль останется прежним,
                                    а это письмо можно просто проигнорировать.
                                </p>
                            </div>

                            <div class="accent-box">
                                <h2 class="accent-title">Доступ можно восстановить за пару минут.</h2>
                                <p class="accent-text">
                                    Перейди по ссылке, задай новый пароль и продолжай работу в привычном ритме.
                                </p>
                            </div>

                            <#if resetUrlValue?has_content>
                                <div class="button-wrap">
                                    <a class="button" href="${resetUrlValue}">Сбросить пароль</a>
                                </div>
                            </#if>
                        </div>

                        <div class="footer">
                            Это письмо отправлено автоматически после запроса на сброс пароля в ${appNameValue}.<br>
                            Если ты не запрашивал восстановление доступа, никаких дополнительных действий не требуется.
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>