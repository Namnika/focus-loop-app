import { Text, StyleSheet } from "react-native";


function TimerDisplay({ seconds }) {
    return (
        <Text style={styles.timerText}>
            Timer: {Math.floor(seconds / 60)}:
            {String(seconds % 60).padStart(2, "0")}
        </Text>
    )
}

const styles = StyleSheet.create({
    timerText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#3CB371',
        marginVertical: 10,
    },
})

export default TimerDisplay