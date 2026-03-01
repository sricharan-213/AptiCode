import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MainLayout() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />
            {/* Add top padding to account for fixed navbar (60px) */}
            <main style={{ flex: 1, padding: "80px 24px 24px", width: "100%", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
                <Outlet />
            </main>
        </div>
    );
}
