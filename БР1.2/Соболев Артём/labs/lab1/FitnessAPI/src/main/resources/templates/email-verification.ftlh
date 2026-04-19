<#ftl output_format="HTML" strip_whitespace=true>
<#assign appNameValue = appName!"FitnessAPI">
<#assign userNameValue = name!"друг">
<#assign verificationUrlValue = verificationUrl!"">
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение email в ${appNameValue}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4eee6;
            color: #1c1a18;
            font-family: "Trebuchet MS", "Segoe UI", sans-serif;
        }

        table { border-spacing: 0; }
        td { padding: 0; }

        .shell { width: 100%; max-width: 620px; }

        .card {
            background: #fffdfa;
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 24px 60px rgba(55, 33, 12, 0.12);
        }

        .hero {
            padding: 36px;
            background:
                    radial-gradient(circle at top right, rgba(255, 226, 166, 0.6), transparent 34%),
                    linear-gradient(135deg, #151515 0%, #2e2b28 48%, #ff6b2c 100%);
            color: #fff9f2;
        }

        .hero-title {
            margin: 20px 0 12px;
            font-size: 32px;
            font-weight: 700;
        }

        .hero-text {
            color: rgba(255, 249, 242, 0.85);
            line-height: 1.7;
        }

        .content {
            padding: 32px;
        }

        .panel {
            margin-bottom: 16px;
            padding: 18px;
            border-radius: 20px;
            background: #fff7ef;
            border: 1px solid #f0e4d8;
        }

        .panel-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 6px;
        }

        .panel-text {
            font-size: 15px;
            color: #5a5148;
        }

        .button {
            display: inline-block;
            padding: 14px 22px;
            border-radius: 14px;
            background: linear-gradient(135deg, #ff8f48, #ff5b2e);
            color: #fffdfa;
            text-decoration: none;
            font-weight: 700;
        }

        .footer {
            padding: 20px 32px 32px;
            font-size: 13px;
            color: #7b7064;
        }
    </style>
</head>
<body>

<table width="100%">
    <tr>
        <td align="center" style="padding: 24px;">
            <table class="shell">
                <tr>
                    <td class="card">

                        <div class="hero">
                            <h1 class="hero-title">Подтверди email</h1>
                            <p class="hero-text">
                                Привет, ${userNameValue}! Остался последний шаг —
                                подтвердить адрес электронной почты и активировать аккаунт.
                            </p>
                        </div>

                        <div class="content">

                            <div class="panel">
                                <div class="panel-title">Почему это важно</div>
                                <div class="panel-text">
                                    Это защищает аккаунт и даёт возможность восстановить доступ,
                                    если ты забудешь пароль.
                                </div>
                            </div>

                            <div class="panel">
                                <div class="panel-title">Что нужно сделать</div>
                                <div class="panel-text">
                                    Просто нажми на кнопку ниже — подтверждение займёт несколько секунд.
                                </div>
                            </div>

                            <#if verificationUrlValue?has_content>
                                <div style="margin-top:20px;">
                                    <a class="button" href="${verificationUrlValue}">
                                        Подтвердить email
                                    </a>
                                </div>
                            </#if>

                        </div>

                        <div class="footer">
                            Если ты не создавал аккаунт в ${appNameValue}, просто проигнорируй это письмо.
                        </div>

                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

</body>
</html>