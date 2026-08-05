Canli Demo: https://inventory-client-etya.onrender.com

Demo Hesabi (sadece goruntuleme yetkisi):
  E-posta: demo@inventorypro.com
  Sifre: Demo1234

---

# Iventra -- Kurumsal Envanter Yonetim Sistemi

TypeScript ile bastan sona gelistirilmis, cok katmanli mimariye sahip full-stack envanter yonetim platformu. Birden fazla proje ve veri merkezi sitesi uzerinden BT altyapi varliklarini yonetmek icin tasarlandi.

---

## Proje Hakkinda

Iventra, kurumlarin sunucu, switch, router, firewall ve diger BT varliklarini birden fazla proje ve site uzerinden takip etmesini saglar. Her proje altinda birden fazla site (veri merkezi, ofis, sube) olusturulabilir ve her site kendi envanterini barindirir.

Sistem 7 farkli rolle tabanli erisim kontrolu, WebSocket uzerinden gercek zamanli bildirimler, her veri degisikliginde audit log kaydi, Redis onbellekleme ve CI/CD pipeline icerir.

---

## Teknoloji Yigini

**Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), Redis (ioredis), Socket.io, JWT (dual token), bcrypt, Zod, Winston

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router v7, Axios, Framer Motion, Recharts, Socket.io-client

**DevOps:** Docker (multi-stage build), Docker Compose, Nginx, GitHub Actions CI/CD

**Test:** Vitest, Supertest, MongoDB Memory Server, React Testing Library

---

## Mimari Yapi

Backend katmanli mimari (layered architecture) izler. Sorumluluklar net bir sekilde ayrilmistir:

**Controller** katmani HTTP isteklerini alir ve is mantigi icermez; istekleri dogrudan service katmanina yonlendirir. Bu katmanin ince tutulmasi, endpoint'lerin test edilebilirligini ve bakimini kolaylastirir.

**Service** katmani tum is mantigini, sahiplik dogrulamasini (proje sahibi mi?), veri manipulasyonunu ve denetim kaydi olusturmayi icerir. Ornegin `InventoryService.create()` once projeye erisim yetkisini dogrular, sonra kaydi olusturur, audit log yazar, cache invalidate eder ve WebSocket bildirimi gonderir.

**Model** katmani Mongoose semalarini tanimlar. Indeksler (compound, text), pre-save hook'lari (sifre hashleme, otomatik asset ID uretimi), virtual alanlar ve referans iliskileri bu katmanda yer alir.

**Middleware** katmani cross-cutting concern'leri kapsar: JWT dogrulama (`authenticate`), rol bazli yetkilendirme (`authorize`), Zod ile girdi dogrulama (`validate`), Redis onbellekleme (`cacheMiddleware`), istek loglama (`requestLogger`) ve merkezi hata yonetimi (`errorHandler`).

**Validator** katmani tum endpoint'lerde tip guvenli girdi dogrulamasi icin Zod semalari kullanir. Ornegin `inventoryItemSchema` cihaz adi, IP adresi, seri numarasi gibi alanlari dogrular ve varsayilan degerler atar.

Frontend tarafinda React Context API ile durum yonetimi (Auth, Theme, Socket), performans icin lazy-loaded rotalar ve 401 yanitlarinda otomatik token yenileme yapan Axios interceptor kullanilir.

---

## Temel Ozellikler

### Kimlik Dogrulama ve Yetkilendirme

JWT dual token sistemi kullanilir: access token (15 dk) ve refresh token (7 gun) ayri secret anahtarlarla imzalanir. Refresh token'lar veritabaninda saklanir ve her kullanmda rotate edilir; ayni token ikinci kez kullanilirsa token theft tespit edilip kullanicinin tum oturumlari iptal edilir (reuse detection). Sifre hashleme bcrypt ile maliyet faktoru 12 uzerinden yapilir. Kullanici kaydi sadece admin roluyle yapilabilir (public registration yoktur).

Sistemde 7 rol tanimlidir: admin, project_manager, engineer, viewer, department_manager, technician, auditor. Her endpoint, once `authenticate` middleware ile token dogrulanir, sonra `authorize` middleware ile rol kontrolu yapilir.

### Envanter Yonetimi

Tam CRUD operasyonlariyla birlikte sunucu tarafli arama, coklu filtre (vendor, durum, isletim sistemi, rack) ve sayfalama desteklenir. Toplu islemler olarak Excel'den ice aktarma (Zod ile satir satir dogrulama), toplu guncelleme, toplu silme ve siteler arasi toplu tasima yapilabilir. Rack gorsellestirme ozelligiyle ekipmanlar fiziksel rack pozisyonuna gore goruntulenir. Her envanter kaydina otomatik asset ID atanir (AST-2026-000001 formatinda).

### Gercek Zamanli Iletisim

Socket.io baglantisinda JWT dogrulama uygulanir; kimliksiz baglanti girisimleri reddedilir. Envanter olusturma, guncelleme, silme islemleri anlik bildirim olarak tum bagli istemcilere iletilir.

### Onbellekleme

Redis ile secici cache invalidation uygulanir. Dashboard istatistikleri 60 saniye, filtre secenekleri 300 saniye onbelleklenir. Graceful degradation desteklenir: Redis mevcut degilse uygulama onbelleksiz calismaya devam eder.

### Denetim Kaydi (Audit Trail)

Her olusturma, guncelleme, silme ve tasima islemi kullanici kimligi, zaman damgasi, degisen alanlar (eski ve yeni degerler) ve metadata ile loglanir. Bu kayitlar envanter detay sayfasinda timeline olarak goruntulenir.

### Loglama ve Gozlemlenebilirlik

Winston ile yapilandirilmis JSON loglama yapilir (production'da dosya rotasyonu, gelistirmede renkli konsol ciktisi). Her HTTP istegi metod, URL, durum kodu, sure ve IP ile loglanir. Prometheus uyumlu metrics endpoint'i ve health check endpoint'i mevcuttur.

---

## Proje Yapisi

```
server/src/
  config/          Veritabani, Redis ve Socket.io baglanti yapilandirmasi
  controllers/     HTTP istek isleyicileri (ince katman, servislere yonlendirir)
  middleware/      auth, authorize, validate, cache, errorHandler, requestLogger
  models/          Mongoose semalari: User, Project, Site, InventoryItem, AuditLog
  routes/          Express router tanimlari ve OpenAPI dokumantasyonu
  services/        Is mantigi, sahiplik dogrulamasi, denetim kaydi
  utils/           JWT token, AppError, logger, escapeRegex, pagination, sanitize
  validators/      Zod dogrulama semalari
  __tests__/       Backend test dosyalari (auth, RBAC, CRUD, bulk, validation, edge case, integration)
  Dockerfile       Multi-stage build, Alpine, non-root user, HEALTHCHECK

client/src/
  components/      Layout (AppLayout, Navbar) ve UI (Modal, Skeleton, GlobalSearch, ExportMenu, RackView)
  context/         AuthContext, ThemeContext, SocketContext
  hooks/           useDebounce, useLocalStorage, useMediaQuery
  pages/           Tum sayfalar (React.lazy ile lazy-loaded)
  services/        Token yenileme interceptor'lu Axios instance
  types/           TypeScript arayuz tanimlari
  __tests__/       Frontend test dosyalari
  Dockerfile       Nginx ile multi-stage build
  nginx.conf       SPA fallback, API/WebSocket reverse proxy, gzip, guvenlik header'lari

.github/workflows/ci.yml    CI/CD: lint, tip kontrolu, build, test + coverage, Docker build
docker-compose.yml           Tam stack: server, client, MongoDB, Redis
```

---

## Kurulum

**Gereksinimler:** Node.js 20+, MongoDB 7+, Redis 7+ (opsiyonel)

### Yerel Gelistirme

```bash
git clone https://github.com/meelikeuyar/inventory-app.git
cd inventory-app

# MongoDB ve Redis'i Docker ile baslat
docker run -d --name inv-mongo -p 27017:27017 mongo:7
docker run -d --name inv-redis -p 6379:6379 redis:7-alpine

# Backend
cd server
cp .env.example .env      # .env dosyasini duzenle: JWT_SECRET, JWT_REFRESH_SECRET, SEED_PASSWORD doldur
npm install
npm run seed              # Ornek veri yukle (4 kullanici, 3 proje, 5 site, 100 envanter)
npm run dev               # http://localhost:5000

# Frontend (ayri terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

### Docker Compose

```bash
cp server/.env.example server/.env    # JWT secret'lari ve sifreleri doldur
docker compose up --build             # http://localhost
```

---

## Ortam Degiskenleri

Tum yapilandirma ortam degiskenlerinden yuklenir. Tam liste icin `server/.env.example` dosyasina bakin.

| Degisken | Aciklama | Varsayilan |
|----------|----------|------------|
| PORT | Sunucu portu | 5000 |
| MONGODB_URI | MongoDB baglanti dizesi | (zorunlu) |
| JWT_SECRET | Access token imzalama anahtari | (zorunlu) |
| JWT_REFRESH_SECRET | Refresh token imzalama anahtari | (zorunlu) |
| JWT_EXPIRES_IN | Access token suresi | 15m |
| JWT_REFRESH_EXPIRES_IN | Refresh token suresi | 7d |
| CLIENT_URL | Izin verilen CORS kaynagi | http://localhost:5173 |
| REDIS_URL | Redis baglanti dizesi | (opsiyonel) |
| SEED_PASSWORD | Seed kullanicilari icin sifre | (zorunlu, seed icin) |
| METRICS_TOKEN | Metrics endpoint erisim tokeni | (opsiyonel) |

---

## API Endpointleri

Tam dokumantasyon: `http://localhost:5000/api/docs` (Swagger UI)

| Alan | Endpointler | Yetkilendirme |
|------|------------|---------------|
| Auth | login, register, refresh, logout, me | register: admin, login/refresh: public, me: authenticated |
| Projeler | CRUD (cascade delete) | authenticated, create/delete: admin/pm |
| Siteler | CRUD (cascade delete) | authenticated, create/delete: admin/pm |
| Envanter | CRUD + detay + timeline | authenticated, create: admin/pm/engineer/tech, delete: admin/pm |
| Toplu Islemler | import, update, delete, move | authenticated, rol bazli |
| Kullanicilar | list, rol degistir, aktiflik, sifre sifirla | admin only |
| Dashboard | istatistikler, aktivite, arama, filtre | authenticated |
| Sistem | health, metrics | health: public, metrics: admin/token |

---

## Test

### Backend Testleri

| Test Grubu | Kapsam |
|------------|--------|
| Auth | Kayit, giris, tekrar e-posta reddi, yanlis sifre, token dogrulama |
| Yetkilendirme | RBAC: viewer olusturamaz, admin olusturabilir, engineer silemez |
| Envanter | CRUD, toplu import, vendor/durum filtreleme, sayfalama |
| Proje | CRUD, cascade silme, kullanicilar arasi izolasyon |
| Toplu Islemler | Toplu import, bos veri reddi, toplu silme |
| Dogrulama | Zod sema uygulamasi: gecersiz e-posta, kisa sifre, bos isim |
| Uc Durumlar | 404, health check, gecersiz ObjectId, buyuk govde reddi |
| Entegrasyon | Uctan uca API akisi: kayit, giris, CRUD, cascade silme |

### Frontend Testleri

| Test Grubu | Kapsam |
|------------|--------|
| App | Hatasiz render, kimliksiz kullaniciya login gosterimi |
| ErrorBoundary | Normal render, hatalarda fallback UI |
| useDebounce | Baslangic degeri, geciktirilmis guncelleme, zamanlayici sifirlama |
| Config | API URL, ortam degiskeni oneki, rol ve durum degerleri |

```bash
# Backend
cd server
npm test                    # Tum testleri calistir
npm run test:coverage       # Kapsam raporuyla calistir

# Frontend
cd client
npm test
```

---

## CI/CD Pipeline

GitHub Actions, main ve develop dallarinda push ve pull request'lerde calisir:

1. **Server Quality** -- ESLint, TypeScript tip kontrolu, production build
2. **Server Test** -- Tum testler kapsam raporuyla (MongoDB service container, artifact upload)
3. **Client Quality** -- ESLint, TypeScript tip kontrolu, production build
4. **Docker Build** -- Server ve client imajlarini derler ve dogrular (sadece main)

---

## Docker

Her iki servis multi-stage build kullanir:

**Server:** Node 20 Alpine uzerinde build, production asamasinda sadece uretim bagimliliklariyla npm ci, root olmayan kullanici (appuser) olarak calisir, HEALTHCHECK tanimli, kaynak limitleri uygulanir.

**Client:** Node 20 Alpine ile build asamasi, Nginx Alpine ile production asamasi. Nginx yapilandirmasi SPA fallback, API ve WebSocket reverse proxy, gzip sikistirma ve guvenlik header'larini icerir.

Docker Compose ile tum stack (MongoDB, Redis, Server, Client) tek komutla ayaga kalkar. Volume'lar ile veri kaliciligi saglanir.

---

## Lisans

MIT