import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppLayout } from '@/components/layout/app-layout';
import { useAnalytics } from '@/hooks/use-analytics';

// Pages
import { HomePage } from '@/pages/home';
import { CatalogPage } from '@/pages/catalog';
import { CartPage } from '@/pages/cart';
import { CheckoutPage } from '@/pages/checkout';
import { VideoDetailPage, FavoritesPage, ComparePage, HelpPage, ContactsPage, ProfilePage, PaymentPage, LoginPage, RegisterPage, AdminLogin, AdminDashboard, AdminVideos, AdminOrders, AdminUsers } from '@/pages';
import { AdminLayout } from '@/components/layout/admin-layout';
import NotFound from '@/pages/not-found';

function MainRouter() {
  useAnalytics();
  return (
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
      <Route path="/profile" component={ProfilePage} />
      <Route path="/payment/:orderId" component={PaymentPage} />
      
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />

      <Route path="/admm" component={AdminLogin} />
      <Route path="/admm/:rest*">
        <AdminLayout>
          <Switch>
            <Route path="/admm/dashboard" component={AdminDashboard} />
            <Route path="/admm/videos" component={AdminVideos} />
            <Route path="/admm/orders" component={AdminOrders} />
            <Route path="/admm/users" component={AdminUsers} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export function AppRouter() {
  return (
    <AppLayout>
      <MainRouter />
    </AppLayout>
  );
}
