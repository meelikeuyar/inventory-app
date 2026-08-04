import { Router, Request, Response } from 'express';

const router = Router();

const apiDocs = {
  openapi: '3.0.3',
  info: {
    title: 'InventoryPro API',
    version: '2.0.0',
    description: 'Full-stack envanter yönetim sistemi REST API dokümantasyonu. Proje bazlı, çok siteli envanter takip sistemi.',
    contact: { name: 'API Support' },
  },
  servers: [{ url: '/api', description: 'API Server' }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http' as const, scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT Access Token. Login/Register ile alınır.' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          email: { type: 'string', format: 'email', example: 'admin@inventorypro.com' },
          fullName: { type: 'string', example: 'Admin User' },
          role: { type: 'string', enum: ['admin', 'project_manager', 'engineer', 'viewer'] },
          isActive: { type: 'boolean', example: true },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Turkcell Data Center' },
          description: { type: 'string', example: 'Ana veri merkezi altyapısı' },
          siteCount: { type: 'number', example: 3 },
          itemCount: { type: 'number', example: 50 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Site: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'İstanbul DC' },
          code: { type: 'string', example: 'IST' },
          project: { type: 'string' },
          itemCount: { type: 'number' },
        },
      },
      InventoryItem: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Server-01' },
          ipAddress: { type: 'string', example: '10.0.0.1' },
          serialNumber: { type: 'string', example: 'SN-001' },
          vendor: { type: 'string', example: 'Dell' },
          model: { type: 'string', example: 'PowerEdge R740' },
          cpu: { type: 'string', example: 'Intel Xeon Gold 6248' },
          ram: { type: 'string', example: '128GB' },
          storage: { type: 'string', example: '1TB SSD' },
          os: { type: 'string', example: 'Ubuntu 22.04' },
          rack: { type: 'string', example: 'RACK-A01' },
          cabinet: { type: 'string', example: 'CAB-01' },
          rackPosition: { type: 'number', example: 5 },
          status: { type: 'string', enum: ['active', 'inactive', 'maintenance', 'decommissioned'] },
          warrantyDate: { type: 'string', format: 'date-time', nullable: true },
          notes: { type: 'string' },
          site: { type: 'string' },
          addedBy: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedInventory: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/InventoryItem' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
              pages: { type: 'number' },
            },
          },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          projects: { type: 'number' },
          sites: { type: 'number' },
          items: { type: 'number' },
          offline: { type: 'number' },
          maintenance: { type: 'number' },
          warrantyExpiring: { type: 'number' },
          statusDistribution: { type: 'array', items: { type: 'object' } },
          vendorDistribution: { type: 'array', items: { type: 'object' } },
          osDistribution: { type: 'array', items: { type: 'object' } },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    // ===== AUTH =====
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Yeni kullanıcı kaydı',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password', 'fullName'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 }, fullName: { type: 'string', minLength: 2 } } } } } },
        responses: { 201: { description: 'Kayıt başarılı', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } }, 409: { description: 'E-posta zaten kayıtlı' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Kullanıcı girişi',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Giriş başarılı', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } }, 401: { description: 'Hatalı kimlik bilgileri' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Token yenileme',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
        responses: { 200: { description: 'Yeni token çifti' }, 401: { description: 'Geçersiz refresh token' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'], summary: 'Mevcut kullanıcı bilgisi', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Kullanıcı bilgisi' }, 401: { description: 'Yetkilendirme gerekli' } },
      },
    },
    // ===== PROJECTS =====
    '/projects': {
      get: { tags: ['Projects'], summary: 'Projeleri listele', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Proje listesi', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } } } },
      post: { tags: ['Projects'], summary: 'Proje oluştur (admin, project_manager)', security: [{ BearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string' } } } } } }, responses: { 201: { description: 'Proje oluşturuldu' }, 403: { description: 'Yetki yok' } } },
    },
    '/projects/{id}': {
      put: { tags: ['Projects'], summary: 'Proje güncelle', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } } }, responses: { 200: { description: 'Güncellendi' }, 404: { description: 'Bulunamadı' } } },
      delete: { tags: ['Projects'], summary: 'Proje sil (cascade — siteler ve envanterler de silinir)', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Silindi' }, 404: { description: 'Bulunamadı' } } },
    },
    // ===== SITES =====
    '/projects/{projectId}/sites': {
      get: { tags: ['Sites'], summary: 'Siteleri listele', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Site listesi' } } },
      post: { tags: ['Sites'], summary: 'Site oluştur', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'code'], properties: { name: { type: 'string' }, code: { type: 'string', minLength: 2, maxLength: 5 } } } } } }, responses: { 201: { description: 'Site oluşturuldu' }, 409: { description: 'Site kodu zaten mevcut' } } },
    },
    '/projects/{projectId}/sites/{id}': {
      put: { tags: ['Sites'], summary: 'Site güncelle', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Güncellendi' } } },
      delete: { tags: ['Sites'], summary: 'Site sil (envanter kayıtları da silinir)', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Silindi' } } },
    },
    // ===== INVENTORY =====
    '/projects/{projectId}/sites/{siteId}/items': {
      get: {
        tags: ['Inventory'], summary: 'Envanter kayıtlarını listele (pagination + filter)', security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'siteId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Arama (isim, IP, seri no, vendor)' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'vendor', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'maintenance', 'decommissioned'] } },
          { name: 'os', in: 'query', schema: { type: 'string' } },
          { name: 'rack', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Envanter listesi ve pagination', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedInventory' } } } } },
      },
      post: {
        tags: ['Inventory'], summary: 'Envanter kaydı ekle', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'siteId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, ipAddress: { type: 'string' }, serialNumber: { type: 'string' }, vendor: { type: 'string' }, model: { type: 'string' }, cpu: { type: 'string' }, ram: { type: 'string' }, storage: { type: 'string' }, os: { type: 'string' }, rack: { type: 'string' }, cabinet: { type: 'string' }, rackPosition: { type: 'number' }, status: { type: 'string', enum: ['active', 'inactive', 'maintenance', 'decommissioned'] }, warrantyDate: { type: 'string', format: 'date-time' }, notes: { type: 'string' } } } } } },
        responses: { 201: { description: 'Kayıt oluşturuldu' } },
      },
    },
    '/projects/{projectId}/sites/{siteId}/items/{id}': {
      get: { tags: ['Inventory'], summary: 'Envanter kaydı detayı', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'siteId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Kayıt detayı' }, 404: { description: 'Bulunamadı' } } },
      put: { tags: ['Inventory'], summary: 'Envanter kaydı güncelle', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'siteId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Güncellendi' } } },
      delete: { tags: ['Inventory'], summary: 'Envanter kaydı sil', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'siteId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Silindi' } } },
    },
    '/projects/{projectId}/sites/{siteId}/items/bulk': {
      post: { tags: ['Inventory'], summary: 'Toplu envanter aktarımı', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'siteId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['items'], properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, vendor: { type: 'string' }, status: { type: 'string' } } } } } } } } }, responses: { 201: { description: 'Kayıtlar eklendi' } } },
    },
    '/projects/{projectId}/sites/{siteId}/items/bulk-delete': {
      post: { tags: ['Inventory'], summary: 'Toplu silme', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'siteId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['itemIds'], properties: { itemIds: { type: 'array', items: { type: 'string' } } } } } } }, responses: { 200: { description: 'Silindi' } } },
    },
    '/projects/{projectId}/sites/{siteId}/items/bulk-update': {
      post: { tags: ['Inventory'], summary: 'Toplu güncelleme', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'siteId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['itemIds', 'updates'], properties: { itemIds: { type: 'array', items: { type: 'string' } }, updates: { type: 'object' } } } } } }, responses: { 200: { description: 'Güncellendi' } } },
    },
    '/projects/{projectId}/sites/{siteId}/items/bulk-move': {
      post: { tags: ['Inventory'], summary: 'Toplu site taşıma', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'siteId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['itemIds', 'targetSiteId'], properties: { itemIds: { type: 'array', items: { type: 'string' } }, targetSiteId: { type: 'string' } } } } } }, responses: { 200: { description: 'Taşındı' } } },
    },
    '/projects/{projectId}/sites/{siteId}/items/rack-view': {
      get: { tags: ['Inventory'], summary: 'Rack görünümü', security: [{ BearerAuth: [] }], parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'siteId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Rack-grouped items' } } },
    },
    // ===== USERS =====
    '/users': {
      get: { tags: ['Users'], summary: 'Kullanıcıları listele (admin)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Kullanıcı listesi' }, 403: { description: 'Yetki yok' } } },
    },
    '/users/{id}/role': {
      patch: { tags: ['Users'], summary: 'Kullanıcı rolü değiştir (admin)', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['admin', 'project_manager', 'engineer', 'viewer'] } } } } } }, responses: { 200: { description: 'Rol güncellendi' } } },
    },
    '/users/{id}/toggle-active': {
      patch: { tags: ['Users'], summary: 'Kullanıcı aktiflik toggle (admin)', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Güncellendi' } } },
    },
    '/users/{id}/reset-password': {
      post: { tags: ['Users'], summary: 'Admin tarafından şifre sıfırlama', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Şifre sıfırlandı' } } },
    },
    // ===== GLOBAL =====
    '/inventory': {
      get: { tags: ['Global'], summary: 'Tüm envanter kayıtları (global)', security: [{ BearerAuth: [] }], parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'vendor', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'Envanter listesi' } } },
    },
    '/dashboard/stats': {
      get: { tags: ['Global'], summary: 'Dashboard istatistikleri', responses: { 200: { description: 'İstatistikler', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardStats' } } } } } },
    },
    '/activity': {
      get: { tags: ['Global'], summary: 'Son aktivite logları', parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 30 } }], responses: { 200: { description: 'Aktivite listesi' } } },
    },
    '/search': {
      get: { tags: ['Global'], summary: 'Global arama', parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 } }], responses: { 200: { description: 'Arama sonuçları' } } },
    },
    '/filter-options': {
      get: { tags: ['Global'], summary: 'Filter seçenekleri (vendor, os, rack)', responses: { 200: { description: 'Filter options' } } },
    },
    '/health': {
      get: { tags: ['Global'], summary: 'Health check', responses: { 200: { description: 'Healthy' }, 503: { description: 'Degraded' } } },
    },
  },
};

router.get('/docs', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html><head>
  <title>InventoryPro API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head><body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>SwaggerUIBundle({ spec: ${JSON.stringify(apiDocs)}, dom_id: '#swagger-ui', deepLinking: true, layout: 'StandaloneLayout' });</script>
</body></html>`;
  res.type('html').send(html);
});

router.get('/docs/json', (_req: Request, res: Response) => {
  res.json(apiDocs);
});

export default router;
