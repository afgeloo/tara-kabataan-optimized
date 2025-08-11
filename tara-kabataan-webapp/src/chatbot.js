import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import "./global-css/chatbot.css";
import { IonIcon } from "@ionic/react";
import { chatbubblesOutline } from "ionicons/icons";
const Chatbot = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);
    const [messages, setMessages] = useState([]);
    const [strictProductSearch, setStrictProductSearch] = useState(false); // kept for your toggle use
    const [isTyping, setIsTyping] = useState(false);
    const [isDisplayingMessage, setIsDisplayingMessage] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const textBoxRef = useRef(null);
    const listRef = useRef(null);
    // internal flags to avoid extra renders
    const abortGeminiRef = useRef(null);
    const abortSearchRef = useRef(null);
    const typingRaf = useRef(null);
    // -- helpers
    const generateSessionId = useCallback(() => {
        if ("crypto" in window && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }
        return "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    }, []);
    const createUUID = useCallback(() => {
        if ("crypto" in window && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }
        // fallback v4-ish
        let s = Array(36).fill("0");
        const hex = "0123456789abcdef";
        for (let i = 0; i < 36; i++)
            s[i] = hex[Math.floor(Math.random() * 16)];
        s[14] = "4";
        s[19] = hex[(parseInt(s[19], 16) & 0x3) | 0x8];
        s[8] = s[13] = s[18] = s[23] = "-";
        return s.join("");
    }, []);
    // sanitize contentEditable -> plain text (keep \n)
    const getCleanText = useCallback(() => {
        const el = textBoxRef.current;
        if (!el)
            return "";
        // Replace block-level breaks to \n, strip tags
        const html = el.innerHTML
            .replace(/<div>/gi, "\n")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/div>/gi, "");
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || "";
        // normalize lines -> <br> for your renderer
        return text
            .split("\n")
            .map((s) => s.trimEnd())
            .join("<br>")
            .trim();
    }, []);
    // auto-enter animation delay
    useEffect(() => {
        const t = setTimeout(() => setHasEntered(true), 300);
        return () => clearTimeout(t);
    }, []);
    // session init (localStorage safe)
    useEffect(() => {
        const myStorage = window.localStorage;
        let existing = myStorage.getItem("chatbot_session");
        if (!existing) {
            existing = generateSessionId();
            myStorage.setItem("chatbot_session", existing);
        }
        setSessionId(existing);
        if (!myStorage.getItem("chatID")) {
            myStorage.setItem("chatID", createUUID());
        }
    }, [generateSessionId, createUUID]);
    const openElement = useCallback(() => {
        setIsExpanded(true);
        // focus input
        requestAnimationFrame(() => textBoxRef.current?.focus());
        if (messages.length === 0) {
            setIsTyping(true);
            setIsDisplayingMessage(true);
            setTimeout(() => {
                displayReply("Mabuhay! Ako si Baby Baka, ang iyong gabay mula sa Tara Kabataan. Paano kita matutulungan sa araw na ito?");
            }, 600);
        }
    }, [messages.length]);
    const closeElement = useCallback((event) => {
        event.stopPropagation();
        setIsExpanded(false);
    }, []);
    // Close on outside click + ESC when expanded
    useEffect(() => {
        if (!isExpanded)
            return;
        const onDocClick = (e) => {
            const root = e.target?.closest(".floating-chat");
            if (!root)
                setIsExpanded(false);
        };
        const onKey = (e) => {
            if (e.key === "Escape")
                setIsExpanded(false);
        };
        document.addEventListener("click", onDocClick);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("click", onDocClick);
            window.removeEventListener("keydown", onKey);
        };
    }, [isExpanded]);
    // scroll to bottom when messages change
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list)
            return;
        list.scrollTop = list.scrollHeight;
    }, [messages, isTyping, isDisplayingMessage]);
    const sendNewMessage = useCallback(() => {
        if (isTyping || isDisplayingMessage)
            return;
        const txt = getCleanText();
        if (!txt)
            return;
        setMessages((prev) => [...prev, { text: txt, type: "self" }]);
        if (textBoxRef.current) {
            textBoxRef.current.innerHTML = "";
            textBoxRef.current.focus();
        }
        setIsTyping(true);
        setIsDisplayingMessage(true);
        setTimeout(() => {
            if (strictProductSearch) {
                searchProduct(txt);
            }
            else {
                handlePredefinedReplies(txt);
            }
        }, 250);
    }, [getCleanText, isTyping, isDisplayingMessage, strictProductSearch]);
    const handlePredefinedReplies = useCallback((message) => {
        if (isTyping || isDisplayingMessage)
            return;
        setIsTyping(true);
        setIsDisplayingMessage(true);
        const m = message.toLowerCase();
        if (m.includes("ano ang tara kabataan")) {
            displayReply("Ang Tara Kabataan (TK) ay isang organisasyon ng mga kabataan sa Maynila na itinatag para isulong ang kaginhawaan ng bawat kabataan at Manilenyo. Pinapahalagahan ng samahan ang pakikipagkapwa ng mga Pilipino na nakasandig sa ating karapatan at pagkakapantay-pantay. Naniniwala ang TK sa kakayahan ng bawat kabataan, sa loob at labas ng paaralan, na siyang higit na dapat mabigyan ng oportunidad na malinang at mapaunlad. Mula rito, mas makikilala ng kabataan ang kaniyang sarili at matatanaw ang kaniyang mahalagang papel sa komunidad, lipunan, at bayan. Mula sa sarili tungo sa bayan ang siyang hinihikayat ng Tara Kabataan sa kaniyang kapwa.");
        }
        else if (m.includes("paano sumali sa tara kabataan")) {
            displayReply("Upang sumali sa Tara Kabataan, maaari mong bisitahin ang aming website at punan ang form para sa pagiging miyembro. Maaari ka ring dumalo sa aming mga kaganapan at pagpupulong upang mas makilala mo ang aming organisasyon at malaman kung paano ka makakasali.");
        }
        else if (m.includes("ano ang mga adbokasiya ng tara kabataan") ||
            m.includes("ano ang advocacies ng tara kabataan")) {
            displayReply(`Ang mga adbokasiya ng Tara Kabataan (5 K) ay:\n\n1. KALUSUGAN\n   Pagtataguyod ng abot-kaya at makataong serbisyong pangkalusugan para sa lahat.\n\n2. KALIKASAN\n   Pangunguna sa pagkilos para sa katarungang pangklima at pangangalaga sa kapaligiran.\n\n3. KARUNUNGAN\n   Pagsusulong ng komprehensibo at nagpapalaya na edukasyon.\n\n4. KULTURA\n   Pagtitibay ng pambansang pagkakakilanlan at malikhaing pag-iisip.\n\n5. KASARIAN\n   Pagpapahalaga sa pagkakapantay-pantay ng kasarian at inklusibong lipunan.\n\nBisitahin ang pahina ng "About" para sa karagdagang impormasyon.`);
        }
        else {
            askGemini(message);
        }
    }, [isTyping, isDisplayingMessage]);
    const askGemini = useCallback(async (message) => {
        setIsTyping(true);
        setIsDisplayingMessage(true);
        abortGeminiRef.current?.abort();
        abortGeminiRef.current = new AbortController();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/askGemini.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, session_id: sessionId }),
                signal: abortGeminiRef.current.signal,
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.session_id && data.session_id !== sessionId) {
                setSessionId(data.session_id);
                localStorage.setItem("chatbot_session", data.session_id);
            }
            const reply = data.reply || "Paumanhin, hindi ko masasagot ang iyong katanungan.";
            displayReply(reply);
        }
        catch (err) {
            if (err?.name === "AbortError")
                return;
            console.error("Error contacting Gemini:", err);
            displayReply("An error occurred while contacting Gemini.");
        }
    }, [sessionId]);
    const searchProduct = useCallback(async (productName) => {
        abortSearchRef.current?.abort();
        abortSearchRef.current = new AbortController();
        try {
            const res = await fetch("searchProduct.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
                body: new URLSearchParams({ productName, session_id: sessionId }),
                signal: abortSearchRef.current.signal,
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            setMessages((prev) => [...prev, { text, type: "other" }]);
        }
        catch (err) {
            if (err?.name !== "AbortError") {
                setMessages((prev) => [...prev, { text: "Sorry, something went wrong.", type: "other" }]);
            }
        }
        finally {
            setIsDisplayingMessage(false);
            setIsTyping(false);
        }
    }, [sessionId]);
    // Smooth typewriter (rAF; fewer state updates than setTimeout per word)
    const displayReply = useCallback((reply) => {
        setIsTyping(false);
        // push placeholder once
        setMessages((prev) => [...prev, { text: "", type: "other" }]);
        const words = reply.split(" ");
        let i = 0;
        let current = "";
        const step = () => {
            // add a batch of words per frame to keep it snappy
            let added = 0;
            while (i < words.length && added < 3) {
                current += (current ? " " : "") + words[i++];
                added++;
            }
            setMessages((prev) => {
                const copy = prev.slice();
                copy[copy.length - 1] = { text: current, type: "other" };
                return copy;
            });
            if (i < words.length) {
                typingRaf.current = requestAnimationFrame(step);
            }
            else {
                setIsDisplayingMessage(false);
                if (typingRaf.current) {
                    cancelAnimationFrame(typingRaf.current);
                    typingRaf.current = null;
                }
            }
        };
        typingRaf.current = requestAnimationFrame(step);
    }, []);
    useEffect(() => {
        return () => {
            abortGeminiRef.current?.abort();
            abortSearchRef.current?.abort();
            if (typingRaf.current)
                cancelAnimationFrame(typingRaf.current);
        };
    }, []);
    const predefinedMessages = [
        "Ano ang Tara Kabataan?",
        "Paano sumali sa Tara Kabataan?",
        "Ano ang mga adbokasiya ng Tara Kabataan?",
    ];
    return (_jsxs("div", { className: `floating-chat ${hasEntered ? "enter" : ""} ${isExpanded ? "expand" : ""}`, onClick: openElement, style: { bottom: "20px", right: "20px" }, role: "dialog", "aria-label": "Tara, Usap!", "aria-expanded": isExpanded, children: [_jsx(IonIcon, { icon: chatbubblesOutline, style: { fontSize: "24px" } }), _jsxs("div", { className: `chat ${isExpanded ? "enter" : ""}`, style: { height: isExpanded ? "500px" : "60px", transition: "height 0.5s ease-out" }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "headerchat", style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("span", { className: "title", children: "Tara, Usap!" }), _jsx("button", { onClick: closeElement, "aria-label": "Close chat", children: _jsx("b", { className: "fa fa-times", "aria-hidden": "true", children: "x" }) })] }), _jsxs("ul", { className: "messages", ref: listRef, children: [messages.map((msg, i) => (_jsx("li", { className: msg.type, children: _jsx("div", { className: "message-content", dangerouslySetInnerHTML: { __html: msg.text } }) }, i))), isTyping && (_jsx("li", { className: "other typing-indicator", children: _jsxs("div", { className: "message-content typing", children: [_jsx("span", { children: "\u2022" }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: "\u2022" })] }) }))] }), _jsxs("div", { className: "footerchat", children: [_jsx("div", { className: "text-box", contentEditable: true, ref: textBoxRef, onKeyDown: (e) => {
                                    if (e.key === "Enter") {
                                        if (e.shiftKey)
                                            return; // allow linebreak with Shift+Enter
                                        e.preventDefault();
                                        sendNewMessage();
                                    }
                                }, style: { pointerEvents: isTyping || isDisplayingMessage ? "none" : "auto" }, "aria-label": "Type your message", role: "textbox", spellCheck: true }), _jsx("button", { id: "sendMessage", onClick: sendNewMessage, disabled: isTyping || isDisplayingMessage, className: isTyping || isDisplayingMessage ? "disabled-button" : "", children: "send" })] }), _jsx("div", { className: "predefined-messages", children: predefinedMessages.map((q, i) => (_jsx("button", { className: `predefined-message ${isTyping || isDisplayingMessage ? "disabled-button" : ""}`, onClick: () => {
                                if (isTyping || isDisplayingMessage)
                                    return;
                                setMessages((prev) => [...prev, { text: q, type: "self" }]);
                                handlePredefinedReplies(q);
                            }, disabled: isTyping || isDisplayingMessage, children: q }, i))) })] })] }));
};
export default Chatbot;
