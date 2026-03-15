Этот репозиторий представляет собой **серверное ядро** рекламной платформы TrendAds. Здесь продемонстрированы архитектурные подходы к созданию высоконагруженных систем аукционов в реальном времени и асинхронной обработки данных.

## ⚙️ Основная архитектура

Backend платформы спроектирован для работы в распределенной среде **Edge Compute** (Cloudflare Workers) с использованием **Durable Objects** для управления состоянием в реальном времени.

### Ключевые технологические модули:

1.  **Auction Engine (Durable Object)**: 
    - Центр принятия решений, находящийся в RAM воркера.
    - Обрабатывает входящие запросы на подачу объявления за <10мс.
    - Проводит аукцион второй цены среди подходящих кандидатов.

2.  **Event Pipeline (Queue & Consumer)**:
    - Система поглощения событий трекинга через `api/track`.
    - Асинхронная выгрузка данных из очереди в основную БД через [queue-consumer.ts](file:///c:/Users/sasha/Desktop/adsplatform/src/worker/queue-consumer.ts), что гарантирует сохранность данных при пиковых нагрузках.

3.  **Real-time Budgeting**:
    - Модуль [budget-authority.ts](file:///c:/Users/sasha/Desktop/adsplatform/src/worker/budget-authority.ts) обеспечивает мгновенную остановку кампаний при исчерпании лимитов, работая напрямую с распределенным KV-хранилищем.

4.  **Edge API Layer**:
    - Использование Next.js Route Handlers в режиме `edge` для минимизации TTFB (Time to First Byte).

## 🛠 Технологический стек

- **Runtime**: Cloudflare Workers / Durable Objects
- **Framework**: Next.js 15 (Edge API Routes)
- **Database**: Supabase (PostgreSQL)
- **Cache/Indexing**: Cloudflare KV
- **Language**: TypeScript (Strict Mode)

## 📂 Структура системы

- `src/app/api`: Эндпоинты для фронтенда и внешних интеграций.
- `src/worker`: Логика тяжелых фоновых задач и управления состоянием.
- `src/lib`: Слой абстракции данных и интеграции с SDK.


## Апи
- https://trend-ads-front.pages.dev/docs#/

## Контакты для связи
- Telegram: @rovernet

