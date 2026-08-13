import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import videosRouter from "./videos";
import reviewsRouter from "./reviews";
import cartRouter from "./cart";
import favoritesRouter from "./favorites";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import adminRouter from "./admin";
import analyticsRouter from "./analytics";
import sitemapRouter from "./sitemap";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(videosRouter);
router.use(reviewsRouter);
router.use(cartRouter);
router.use(favoritesRouter);
router.use(ordersRouter);
router.use(paymentsRouter);
router.use(adminRouter);
router.use(analyticsRouter);
router.use(sitemapRouter);

export default router;
