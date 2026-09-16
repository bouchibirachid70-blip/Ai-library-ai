import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ToastProvider } from './components/Toast';
import AdminRoute from './components/AdminRoute';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import ToolsList from './pages/ToolsList';
import ToolDetail from './pages/ToolDetail';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import TopTools from './pages/TopTools';
import Submit from './pages/Submit';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTools from './pages/admin/AdminTools';
import AdminToolEdit from './pages/admin/AdminToolEdit';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import AdminArticles from './pages/admin/AdminArticles';
import AdminArticleEdit from './pages/admin/AdminArticleEdit';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAdSlots from './pages/admin/AdminAdSlots';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Admin login (no chrome) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin section (guarded) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="tools" element={<AdminTools />} />
              <Route path="tools/new" element={<AdminToolEdit />} />
              <Route path="tools/:id" element={<AdminToolEdit />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="articles" element={<AdminArticles />} />
              <Route path="articles/new" element={<AdminArticleEdit />} />
              <Route path="articles/:id" element={<AdminArticleEdit />} />
              <Route path="ad-slots" element={<AdminAdSlots />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Public site */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/tools" element={<ToolsList />} />
              <Route path="/tools/:slug" element={<ToolDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:slug" element={<CategoryDetail />} />
              <Route path="/top-tools" element={<TopTools />} />
              <Route path="/submit" element={<Submit />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </AdminAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
