import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/ProtectedRoute';
import { SiteLayout } from './layouts/SiteLayout';
import { CabinetLayout } from './layouts/CabinetLayout';
import {
    BookPage,
    CommentsHistoryPage,
    LikesPage,
    LoginPage,
    MyBooksSearchPage,
    ProfilePage,
    ReadingListPage,
    RegisterPage,
    SearchPage,
} from './pages';

export default function App() {
    return (
        <Routes>
            <Route element={<SiteLayout />}>
                <Route index element={<SearchPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="books/:bookId" element={<BookPage />} />
                <Route
                    path="cabinet"
                    element={
                        <RequireAuth>
                            <CabinetLayout />
                        </RequireAuth>
                    }
                >
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="likes" element={<LikesPage />} />
                    <Route path="reading-list" element={<ReadingListPage />} />
                    <Route path="comments" element={<CommentsHistoryPage />} />
                    <Route path="search" element={<MyBooksSearchPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}
