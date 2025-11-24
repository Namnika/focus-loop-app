import * as StudentApi from "./api/studentApi.js";
import { useEffect, useState, useRef } from "react";
import { AppState } from "react-native";
import io from "socket.io-client";
import LockdownScreen from "./screens/LockdownScreen.js";
import FocusScreen from "./screens/FocusScreen.js";
import RemedialScreen from "./screens/RemedialScreen.js";

const STUDENT_ID = "cf217822-7121-412b-80cb-829cee8671ef";

export default function App() {
	const [status, setStatus] = useState("On Track");
	const [quiz, setQuiz] = useState("");
	const [focusSec, setFocusSec] = useState(0);
	const [timerRunning, setTimerRunning] = useState(false);
	const [intervention, setIntervention] = useState(null);
	const socketRef = useRef(null);
	const interventionIdRef = useRef(null);

	useEffect(() => {
		async function init() {
			try {
				const data = await StudentApi.getStatus(STUDENT_ID)
				setStatus(data.status);
				if (data.current_intervention_id) {
					setIntervention({
						id: data.current_intervention_id,
						task: data.task,
					});
					interventionIdRef.current = data.current_intervention_id;
				}
				else {
					setIntervention(null)
					interventionIdRef.current = null
				}
			} catch (e) {
				console.warn("Failed to fetch initial status", e.message)
			}
		}
		init();

		socketRef.current = io(StudentApi.BACKEND, { query: { student_id: STUDENT_ID } });
		socketRef.current.on("status:update", (payload) => {
			setStatus(payload.status);
			if (payload.status === "Remedial") {
				setIntervention(payload.intervention);
				interventionIdRef.current = payload.intervention?.id;
			}

			if (payload.status === "On Track") {
				setIntervention(null);
				interventionIdRef.current = null;
			}
		});

		const handleVisibility = async () => {
			if (AppState.hidden && timerRunning) {
				setTimerRunning(false);
				try {
					await StudentApi.dailyCheckin(STUDENT_ID, 0, Math.floor(focusSec / 60))
					alert("Focus stopped because you switched tabs — logged as failure.");
				} catch (e) {
					console.warn(e.message);
				}
			}
		};
		const subscription = AppState.addEventListener("change", handleVisibility);
		return () => {
			subscription.remove();
			socketRef.current.disconnect();
		};
	}, [timerRunning, focusSec]);

	useEffect(() => {
		let t;
		if (timerRunning) t = setInterval(() => setFocusSec((s) => s + 1), 1000);
		return () => clearInterval(t);
	}, [timerRunning]);

	// start focus timer
	const start = () => setTimerRunning(true);

	// stop focus timer and submit check-in
	const stop = async () => {
		setTimerRunning(false);
		const mins = Math.floor(focusSec / 60);
		const score = Number(quiz) || 0

		// validation 
		if (score < 0 || score > 10) {
			alert("Quiz score must be between 0 and 10");
			return;
		}
		try {
			const data = await StudentApi.dailyCheckin(STUDENT_ID, score, mins);
			setStatus(data.status);
		} catch (e) {
			console.warn(e.message);
		}
		setFocusSec(0);
	};

	const markComplete = async () => {
		if (!interventionIdRef.current) return;
		await StudentApi.completeIntervention(STUDENT_ID, interventionIdRef.current);
		setStatus("On Track");
		setIntervention(null);
		interventionIdRef.current = null;
	};

	if (status === "Pending Mentor Review") return <LockdownScreen />
	if (status === "Remedial") return <RemedialScreen task={intervention?.task} onComplete={markComplete} />

	return (
		<FocusScreen status={status} running={timerRunning} seconds={focusSec} quiz={quiz} onStart={start} onStop={stop} setQuiz={setQuiz} />
	);
}
