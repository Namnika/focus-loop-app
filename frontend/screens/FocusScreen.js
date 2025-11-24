import React from 'react'
import { Text, Button, View, StyleSheet } from "react-native";
import TimerDisplay from '../components/TimerDisplay';
import QuizInput from '../components/QuizInput';


function FocusScreen({
    status,
    seconds,
    running,
    quiz,
    onStart,
    onStop,
    setQuiz
}) {
    return (
        <View style={styles.normalContainer}>
            <Text style={{ fontSize: 20, marginBottom: 15 }}>Focus Mode — status: {status}</Text>
            <TimerDisplay seconds={seconds} />
            <Button
                title={running ? 'STOP FOCUS AND CHECK-IN' : 'START FOCUS TIMER'}
                onPress={running ? onStop : onStart}
                color={running ? '#FF6347' : '#4682B4'}
            />
            <Text style={{ marginTop: 30 }}>Quiz (0-10)</Text>
            <QuizInput value={quiz} onChange={setQuiz} />
            {
                !running && (
                    <Button title="Submit Check-in (without timer)" onPress={stop} />
                )

            }
        </View>
    )
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
})

export default FocusScreen