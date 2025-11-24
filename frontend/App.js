import { useEffect, useState, useRef } from "react";
import { View, Text, Button, TextInput, StyleSheet, AppState } from "react-native";
import axios from "axios";
import io from "socket.io-client";

const BACKEND = "http://localhost:4000";
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
				const r = await axios.get(`${BACKEND}/student/${STUDENT_ID}/status`);
				setStatus(r.data.status);
				if (r.data.current_intervention_id) {
					setIntervention({
						id: r.data.current_intervention_id,
						task: r.data.task,
					});
					interventionIdRef.current = r.data.current_intervention_id;
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

		socketRef.current = io(BACKEND, { query: { student_id: STUDENT_ID } });
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
					await axios.post(`${BACKEND}/daily-checkin`, {
						student_id: STUDENT_ID,
						quiz_score: 0,
						focus_minutes: Math.floor(focusSec / 60),
					});
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
			const r = await axios.post(`${BACKEND}/daily-checkin`, {
				student_id: STUDENT_ID,
				quiz_score: score,
				focus_minutes: mins,
			});
			setStatus(r.data.status);
		} catch (e) {
			console.warn(e.message);
		}
		setFocusSec(0);
	};

	const markComplete = async () => {
		if (!interventionIdRef.current) return;
		await axios.post(`${BACKEND}/complete-intervention`, {
			student_id: STUDENT_ID,
			intervention_id: interventionIdRef.current,
		});
		setStatus("On Track");
		setIntervention(null);
		interventionIdRef.current = null;
	};

	if (status === "Pending Mentor Review") {
		return (
			<View style={styles.lockedContainer}>
				<Text style={styles.lockedTitle}>🚫 LOCKDOWN 🚫</Text>
				<Text style={styles.lockedMessage}>
					Student Check-in Failed.
				</Text>
				<Text style={styles.lockedMessage}>Analysis in progress. Waiting for Mentor...</Text>
			</View>
		);
	}
	if (status === "Remedial") {
		return (
			<View style={styles.remedialContainer}>
				<Text style={styles.remedialTaskTitle}>
					✅ Assigned Remedial Task ✅
				</Text>
				<Text style={styles.remedialTaskText}>Task: **{intervention?.task || "Assigned by mentor"}**</Text>
				<View style={styles.completeButton}>
					<Button title="Mark Complete" onPress={markComplete} color="#28A745" />
				</View>
			</View>
		);
	}

	return (
		<View style={styles.normalContainer}>
			<Text style={{ fontSize: 20, marginBottom: 15 }}>Focus Mode — status: {status}</Text>
			<Text style={styles.timerText}>
				Timer: {Math.floor(focusSec / 60)}:
				{String(focusSec % 60).padStart(2, "0")}
			</Text>
			<Button
				title={timerRunning ? 'STOP FOCUS AND CHECK-IN' : 'START FOCUS TIMER'}
				onPress={timerRunning ? stop : start}
				color={timerRunning ? '#FF6347' : '#4682B4'}
			/>
			<Text style={{ marginTop: 30 }}>Quiz (0-10)</Text>
			<TextInput
				value={quiz}
				onChangeText={setQuiz}
				keyboardType="numeric"
				style={styles.input}
			/>
			{!timerRunning && (
				<Button title="Submit Check-in (without timer)" onPress={stop} />
			)}

		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},

	normalContainer: {
		flex: 1,
		padding: 30,
		backgroundColor: '#F5FFFA',
		alignItems: 'center',
		justifyContent: 'center',
	},
	timerText: {
		fontSize: 48,
		fontWeight: 'bold',
		color: '#3CB371',
		marginVertical: 10,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 12,
		marginTop: 8,
		marginBottom: 20,
		width: 200,
		textAlign: 'center',
		borderRadius: 8,
	},

	lockedContainer: {
		flex: 1,
		backgroundColor: '#FFEEEE',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 40,
	},

	lockedTitle: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#CC0000',
		textAlign: 'center',
		marginBottom: 15,
	},
	lockedMessage: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#CC0000',
		textAlign: 'center',
		marginBottom: 20,
	},
	remedialContainer: {
		flex: 1,
		backgroundColor: '#E0FFFF',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 40,
	},
	remedialTaskTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#006400',
		marginBottom: 10,
	},
	remedialTaskText: {
		fontSize: 20,
		color: '#4682B4', // Steel Blue
		marginBottom: 30,
		textAlign: 'center',
	},
	completeButton: {
		marginTop: 20,
	}
});
