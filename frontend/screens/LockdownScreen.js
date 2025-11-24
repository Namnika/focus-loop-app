import React from 'react'
import { View, Text, StyleSheet } from "react-native";

function LockdownScreen() {
    return (
        <View style={styles.lockedContainer}>
            <Text style={styles.lockedTitle}>🚫 LOCKDOWN 🚫</Text>
            <Text style={styles.lockedMessage}>
                Student Check-in Failed.
            </Text>
            <Text style={styles.lockedMessage}>Analysis in progress. Waiting for Mentor...</Text>
        </View>
    )
}

const styles = StyleSheet.create({
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
})

export default LockdownScreen