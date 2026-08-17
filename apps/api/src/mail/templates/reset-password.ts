// Письмо «Сброс пароля» — тот же визуальный стиль, что confirm-account,
// но компактнее: без героя и онбординг-блока, только действие.
// Плейсхолдеры: {{USER_NAME}}, {{RESET_URL}} (3 вхождения: кнопка,
// VML-кнопка Outlook, запасная ссылка), {{SUPPORT_EMAIL}}.

export const RESET_PASSWORD_HTML = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>Сброс пароля — FlareonFit</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<style type="text/css">
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
  body{margin:0!important;padding:0!important;width:100%!important}
  a{color:#7BD98A}
  @media only screen and (max-width:620px){
    .wrap{width:100%!important}
    .px{padding-left:20px!important;padding-right:20px!important}
    .btn a{display:block!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#08151F;">

<div style="display:none;font-size:1px;color:#08151F;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Ссылка для смены пароля. Действует 1 час.
  &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#08151F;">
<tr><td align="center" style="padding:28px 12px;">

  <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

    <tr><td align="center" style="padding:0 0 18px 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <span style="font-size:19px;font-weight:700;color:#FDECDC;letter-spacing:.2px;">Flareon<span style="color:#4CB558;">Fit</span></span>
    </td></tr>

    <tr><td style="background-color:#122A3E;border-radius:24px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

        <tr><td height="4" bgcolor="#4CB558" style="height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>

        <tr><td class="px" align="center" style="padding:32px 40px 0 40px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <div style="display:inline-block;padding:6px 14px;background-color:#16324A;border-radius:999px;
                      font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7BD98A;">
            Сброс пароля
          </div>
          <h1 style="margin:16px 0 0 0;font-size:26px;line-height:34px;font-weight:800;color:#FFFFFF;">
            Привет, {{USER_NAME}}!
          </h1>
          <p style="margin:12px 0 0 0;font-size:16px;line-height:25px;color:#A9BFD0;">
            Кто-то (надеемся, вы) запросил смену пароля. Нажмите кнопку — и придумайте новый.
          </p>
        </td></tr>

        <tr><td class="px" align="center" style="padding:26px 40px 0 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn"><tr><td align="center"
              style="border-radius:16px;background-color:#4CB558;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
              href="{{RESET_URL}}" style="height:54px;v-text-anchor:middle;width:340px;" arcsize="30%" stroke="f" fillcolor="#4CB558">
              <w:anchorlock/>
              <center style="color:#06210C;font-family:'Segoe UI',Arial,sans-serif;font-size:17px;font-weight:bold;">Сменить пароль</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="{{RESET_URL}}" target="_blank"
               style="display:inline-block;padding:17px 44px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                      font-size:17px;font-weight:700;color:#06210C;text-decoration:none;border-radius:16px;background-color:#4CB558;">
              Сменить пароль
            </a>
            <!--<![endif]-->
          </td></tr></table>
          <p style="margin:14px 0 0 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#7D93A6;">
            Ссылка действует 1 час
          </p>
        </td></tr>

        <tr><td class="px" style="padding:26px 40px 32px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="background-color:#0E2234;border-radius:14px;">
            <tr><td style="padding:16px 18px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                           font-size:13px;line-height:21px;color:#7D93A6;">
              Кнопка не работает? Скопируйте ссылку в браузер:<br>
              <a href="{{RESET_URL}}" style="color:#7BD98A;word-break:break-all;text-decoration:underline;">{{RESET_URL}}</a>
            </td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>

    <tr><td class="px" align="center" style="padding:22px 24px 0 24px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                                             font-size:12.5px;line-height:20px;color:#63809A;">
      Если вы не запрашивали смену пароля — просто удалите это письмо, пароль останется прежним.
    </td></tr>
    <tr><td align="center" style="padding:14px 24px 0 24px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                                  font-size:12.5px;line-height:20px;color:#4F6A82;">
      FlareonFit · <a href="mailto:{{SUPPORT_EMAIL}}" style="color:#63809A;text-decoration:underline;">{{SUPPORT_EMAIL}}</a>
    </td></tr>
    <tr><td height="28" style="height:28px;line-height:28px;font-size:0;">&nbsp;</td></tr>

  </table>
</td></tr>
</table>
</body>
</html>
`;

export const RESET_PASSWORD_TEXT = `Привет, {{USER_NAME}}!

Кто-то (надеемся, вы) запросил смену пароля в FlareonFit. Перейдите по ссылке и придумайте новый:

{{RESET_URL}}

Ссылка действует 1 час.

Если вы не запрашивали смену пароля — просто удалите это письмо, пароль останется прежним.

FlareonFit · {{SUPPORT_EMAIL}}
`;
