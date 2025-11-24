import React from 'react'
import { StyleSheet, TextInput } from 'react-native'

function QuizInput({ value, onChange }) {
    return (
        <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            style={styles.input}
        />
    )
}

const styles = StyleSheet.create({
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
})

export default QuizInput