# Настройка Ngrok для публичного доступа

## Проблема
Токен `NRXVBGTORZYLWEOMWR5ABI6PUFTYNVFN` - это не authtoken, а скорее всего API key.

## Правильная инструкция:

### Шаг 1: Получите правильный Authtoken

1. Зайдите на https://dashboard.ngrok.com/get-started/your-authtoken
2. Войдите в свой аккаунт (или зарегистрируйтесь)
3. Скопируйте **Authtoken** (он выглядит примерно так: `2abc123def456ghi789jkl012mno345pq_6R7S8T9U0V1W2X3Y4Z5A6B7C8D`)
   - Обычно начинается с цифр
   - Содержит буквы, цифры и подчеркивания
   - Длиннее, чем API key

### Шаг 2: Запустите ngrok

**Вариант A: Через Docker (рекомендуется)**

```bash
docker run -d --name ngrok \
  --network toratau-systems_default \
  -e NGROK_AUTHTOKEN=ВАШ_ПРАВИЛЬНЫЙ_AUTHTOKEN \
  ngrok/ngrok:latest http toratau-systems-frontend-1:80
```

Затем посмотрите URL:
```bash
docker logs ngrok | grep "started tunnel" | grep -o "https://[^ ]*"
```

**Вариант B: Через локальный порт**

```bash
docker run -d --name ngrok \
  -p 4040:4040 \
  -e NGROK_AUTHTOKEN=ВАШ_ПРАВИЛЬНЫЙ_AUTHTOKEN \
  ngrok/ngrok:latest http host.docker.internal:8080
```

Проверьте веб-интерфейс: http://localhost:4040

### Шаг 3: Получите публичную ссылку

После запуска ngrok покажет публичный URL в логах или в веб-интерфейсе на http://localhost:4040

---

## Альтернатива: Использование serveo.net (без регистрации)

Если не хотите регистрироваться в ngrok, можно использовать serveo:

```bash
ssh -R 80:localhost:8080 serveo.net
```

Но это требует SSH клиент и менее надежно.
