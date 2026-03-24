import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { AuthRequest, authMiddleware, roleMiddleware } from '../middlewares/auth';
import { StoreController } from '../controllers/StoreController';
import { ProductController } from '../controllers/ProductController';
import { OrderController } from '../controllers/OrderController';
import { AdminController } from '../controllers/AdminController';
import { ShopkeeperController } from '../controllers/ShopkeeperController';
import { DeliveryController } from '../controllers/DeliveryController'; // Added import

const routes = Router();

// Controllers
const storeController = new StoreController();
const productController = new ProductController();
const orderController = new OrderController();
const adminController = new AdminController();
const shopkeeperController = new ShopkeeperController();
const deliveryController = new DeliveryController(); // Added instantiation

// Auth
routes.use('/auth', authRoutes);

// --- PUBLIC ROUTES ---
routes.post('/calculate-delivery', deliveryController.calculate); // Added route
routes.post('/webhooks/asaas', (req, res) => orderController.handleWebhook(req, res));

// --- CUSTOMER ROUTES ---
routes.get('/stores', authMiddleware, storeController.index);
routes.get('/stores/:storeId/products', authMiddleware, productController.indexByStore);
routes.post('/orders', authMiddleware, roleMiddleware(['CUSTOMER', 'SHOPKEEPER', 'ADMIN']), (req, res) => orderController.create(req as AuthRequest, res));
routes.get('/customer/orders', authMiddleware, roleMiddleware(['CUSTOMER', 'SHOPKEEPER']), (req, res) => orderController.customerOrders(req as AuthRequest, res));
routes.post('/orders/:id/generate-pix', authMiddleware, roleMiddleware(['CUSTOMER', 'COURIER', 'SHOPKEEPER']), (req, res) => orderController.generatePixCharge(req as AuthRequest, res));
routes.get('/orders/:id/check-payment', authMiddleware, roleMiddleware(['CUSTOMER', 'SHOPKEEPER', 'ADMIN']), (req, res) => orderController.checkPayment(req as AuthRequest, res));

// --- COURIER ROUTES ---
routes.get('/courier/available-orders', authMiddleware, roleMiddleware(['COURIER']), orderController.availableOrders);
routes.get('/courier/orders', authMiddleware, roleMiddleware(['COURIER']), (req, res) => orderController.courierDeliveries(req as AuthRequest, res));
routes.patch('/orders/:id/accept', authMiddleware, roleMiddleware(['COURIER']), (req, res) => orderController.acceptOrder(req as AuthRequest, res));
routes.patch('/orders/:id/status-courier', authMiddleware, roleMiddleware(['COURIER']), orderController.updateStatus);
routes.patch('/orders/:id/mark-arrived', authMiddleware, roleMiddleware(['COURIER']), (req, res) => orderController.markArrived(req as AuthRequest, res)); // New route
routes.get('/courier/profile', authMiddleware, roleMiddleware(['COURIER']), (req, res) => orderController.courierProfile(req as AuthRequest, res));
routes.post('/courier/withdraw', authMiddleware, roleMiddleware(['COURIER']), (req, res) => orderController.requestWithdrawal(req as AuthRequest, res));

// --- SHOPKEEPER ROUTES ---
const shopAuth = [authMiddleware, roleMiddleware(['SHOPKEEPER'])];
routes.get('/shop/dashboard', shopAuth, (req: any, res: any) => shopkeeperController.dashboardStats(req, res));
routes.get('/shop/orders', shopAuth, (req: any, res: any) => shopkeeperController.getOrders(req, res));
routes.post('/shop/orders', shopAuth, (req: any, res: any) => shopkeeperController.createOrder(req, res));
routes.patch('/shop/orders/:id/status', shopAuth, (req: any, res: any) => shopkeeperController.updateOrderStatus(req, res));
routes.post('/shop/products', shopAuth, (req: any, res: any) => shopkeeperController.createProduct(req, res));
routes.get('/shop/products', shopAuth, (req: any, res: any) => shopkeeperController.getProducts(req, res));
routes.patch('/shop/products/:id/toggle', shopAuth, (req: any, res: any) => productController.toggleAvailable(req, res));
routes.get('/shop/profile', shopAuth, (req: any, res: any) => shopkeeperController.getProfile(req, res));
routes.put('/shop/profile', shopAuth, (req: any, res: any) => shopkeeperController.updateProfile(req, res));

// --- ADMIN ROUTES ---
const adminAuth = [authMiddleware, roleMiddleware(['ADMIN'])];

// Dashboard
routes.get('/admin/dashboard', adminAuth, adminController.getDashboardStats);

// Stores
routes.post('/admin/stores', adminAuth, storeController.create);
routes.get('/admin/stores', adminAuth, storeController.indexAll);
routes.put('/admin/stores/:id', adminAuth, storeController.update);
routes.delete('/admin/stores/:id', adminAuth, storeController.delete);
routes.patch('/admin/stores/:id/toggle', adminAuth, storeController.toggleActive);

// Products
routes.post('/admin/products', adminAuth, productController.create);
routes.patch('/admin/products/:id/toggle', adminAuth, productController.toggleAvailable);

// Orders Management
routes.get('/admin/orders', adminAuth, orderController.indexAll);
routes.patch('/admin/orders/:id/status', adminAuth, orderController.updateStatus);

// Couriers Management
routes.get('/admin/couriers', adminAuth, adminController.listCouriers);
routes.put('/admin/couriers/:id', adminAuth, adminController.updateCourier);
routes.delete('/admin/couriers/:id', adminAuth, adminController.deleteCourier);
routes.patch('/admin/couriers/:id/status', adminAuth, adminController.updateCourier);

export { routes };
