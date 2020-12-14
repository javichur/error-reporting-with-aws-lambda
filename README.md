# error-reporting-with-aws-lambda
Error reporting in AWS (via email, Slack, Telegram...) using AWS Lambda.

If you subscribe this AWS Lambda to AWS CloudWatch Logs, it's able to notify log messages by email, telegram and Slack.

![AWS Architecture](/images/aws-error-log-notifications.png)

To reduce the number of messages, optimize cost and make it more useful, please apply a filter pattern in the CloudWatch Subscription. In the following example, log messages are filtered with the string "error", but you can be more specific:
![Create CloudWatch Logs Subscription Filter](/images/cloudwatch-logs-subscription-filter.png)

More info: <https://javiercampos.es/blog/2020/12/13/como-recibir-avisos-automaticos-por-telegram-email-slack-etc-si-tu-skill-alexa-esta-fallando>
