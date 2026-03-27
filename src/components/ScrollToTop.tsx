import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement> }) {
    const { pathname } = useLocation();

    useEffect(() => {
        if (scrollRef?.current) {
            scrollRef.current.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}