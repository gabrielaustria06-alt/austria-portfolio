import { useState, useEffect } from "react";
import Login from "./Login";
import App from "./App";
import CampusMap from "./CampusMap";
import Forum from "./Forum";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AuthWrapper() {
    const [user, setUser] = useState(null);
    const [page, setPage] = useState("app"); // "app" | "map" | "forum"
    const [announcement, setAnnouncement] = useState(
        "Welcome to Gordon College! Check the map for room locations and availability."
    );

    useEffect(() => {
        const loadAnnouncement = async () => {
            try {
                const snap = await getDoc(doc(db, "campusMap", "announcement"));
                if (snap.exists() && snap.data().text) {
                    setAnnouncement(snap.data().text);
                }
            } catch (e) {
                console.error(e);
            }
        };
        loadAnnouncement();
    }, []);

    const handleLogin = (role, username) => {
        setUser({ role, username: username || (role === "admin" ? "Admin" : "Student") });
        setPage("app");
    };

    const handleLogout = () => {
        setUser(null);
        setPage("app");
    };

    if (!user) {
        return <Login onLogin={handleLogin} announcement={announcement} />;
    }

    if (page === "map") {
        return <CampusMap userRole={user.role} onBack={() => setPage("app")} />;
    }

    if (page === "forum") {
        return (
            <Forum
                userRole={user.role}
                username={user.username}
                onBack={() => setPage("app")}
            />
        );
    }

    return (
        <App
            userRole={user.role}
            username={user.username}
            onLogout={handleLogout}
            onOpenMap={() => setPage("map")}
            onOpenForum={() => setPage("forum")}
        />
    );
}