import { lazy, Suspense, useEffect } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { AppLayout } from '@/components/layout/app-layout';
import { useAnalytics } from '@/hooks/use-analytics';
import { Spinner } from '@/components/ui/spinner';

// Core pages (loaded synchronously)
import { HomePage } from '@/pages/home';

// Lazy loaded pages
const CatalogPage = lazy(() => import('@/pages/catalog').then(m => ({ default: m.CatalogPage })));
const CartPage = lazy(() => import('@/pages/cart').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('@/pages/checkout').then(m => ({ default: m.CheckoutPage })));
const VideoDetailPage = lazy(() => import('@/pages/video-detail').then(m => ({ default: m.VideoDetailPage })));
const FavoritesPage = lazy(() => import('@/pages/favorites').then(m => ({ default: m.FavoritesPage })));
const ComparePage = lazy(() => import('@/pages/compare').then(m => ({ default: m.ComparePage })));
  const HelpPage = lazy(() => import('@/pages/help').then(m => ({ default: m.HelpPage })));
  const ContactsPage = lazy(() => import('@/pages/contacts').then(m => ({ default: m.ContactsPage })));
  const TermsPage = lazy(() => import('@/pages/terms').then(m => ({ default: m.TermsPage })));
  const ProfilePage = lazy(() => import('@/pages/profile').then(m => ({ default: m.ProfilePage })));
const PaymentPage = lazy(() => import('@/pages/payment').then(m => ({ default: m.PaymentPage })));
const LoginPage = lazy(() => import('@/pages/auth/login').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/register').then(m => ({ default: m.RegisterPage })));
const AdminLogin = lazy(() => import('@/pages/admin/login').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('@/pages/admin/dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminVideos = lazy(() => import('@/pages/admin/videos').then(m => ({ default: m.AdminVideos })));
const AdminOrders = lazy(() => import('@/pages/admin/orders').then(m => ({ default: m.AdminOrders })));
const AdminUsers = lazy(() => import('@/pages/admin/users').then(m => ({ default: m.AdminUsers })));
const AdminAuthorSection = lazy(() => import('@/pages/admin/author-section').then(m => ({ default: m.AdminAuthorSection })));
const AdminReviewsSection = lazy(() => import('@/pages/admin/reviews-section').then(m => ({ default: m.AdminReviewsSection })));
const RequisitesPage = lazy(() => import('@/pages/requisites').then(m => ({ default: m.RequisitesPage })));

const AdminLayout = lazy(() => import('@/components/layout/admin-layout').then(m => ({ default: m.AdminLayout })));
import NotFound from '@/pages/not-found';

function MainRouter() {
  useAnalytics();
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  const fallback = (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner className="w-8 h-8 text-amber-500 opacity-60" />
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/catalog" component={CatalogPage} />
        <Route path="/video/:id" component={VideoDetailPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/favorites" component={FavoritesPage} />
        <Route path="/compare" component={ComparePage} />
        <Route path="/help" component={HelpPage} />
        <Route path="/contacts" component={ContactsPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/requisites" component={RequisitesPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/payment/:orderId" component={PaymentPage} />

        <Route path="/auth/login" component={LoginPage} />
        <Route path="/auth/register" component={RegisterPage} />

        <Route path="/admm" component={AdminLogin} />
        <Route path="/admm/:rest*">
          <AdminLayout>
            <Suspense fallback={fallback}>
              <Switch>
                <Route path="/admm/dashboard" component={AdminDashboard} />
                <Route path="/admm/videos" component={AdminVideos} />
                <Route path="/admm/orders" component={AdminOrders} />
                <Route path="/admm/users" component={AdminUsers} />
                <Route path="/admm/author-section" component={AdminAuthorSection} />
                <Route path="/admm/reviews-section" component={AdminReviewsSection} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </AdminLayout>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export function AppRouter() {
  return (
    <AppLayout>
      <MainRouter />
    </AppLayout>
  );
}
