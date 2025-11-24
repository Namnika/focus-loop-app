import React from 'react'
import { View, Text, Button, StyleSheet } from "react-native";

function RemedialScreen({ task, onComplete }) {
    return (
        <View style={styles.remedialContainer}>
            <Text style={styles.remedialTaskTitle}>
                ✅ Assigned Remedial Task ✅
            </Text>
            <Text style={styles.remedialTaskText}>Task: **{task || "Assigned by mentor"}**</Text>
            <View style={styles.completeButton}>
                <Button title="Mark Complete" onPress={onComplete} color="#28A745" />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
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
        color: '#4682B4',
        marginBottom: 30,
        textAlign: 'center',
    },
    completeButton: {
        marginTop: 20,
    }
})

export default RemedialScreen