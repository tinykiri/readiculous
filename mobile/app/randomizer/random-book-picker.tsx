import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";

interface BookRouletteModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RandomBookPicker({ visible, onClose }: BookRouletteModalProps) {
  const [books, setBooks] = useState(["", ""]);
  const [status, setStatus] = useState<"idle" | "spinning" | "won">("idle");
  const [currentDisplayBook, setCurrentDisplayBook] = useState("");

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleTextChange = (text: string, index: number) => {
    const newBooks = [...books];
    newBooks[index] = text;
    setBooks(newBooks);
  };

  const addBookField = () => {
    if (books.length >= 10) return;
    setBooks([...books, ""]);
  };

  const removeBookField = (index: number) => {
    const newBooks = books.filter((_, i) => i !== index);
    setBooks(newBooks);
  };

  const handleSpin = () => {
    const validBooks = books.filter((b) => b.trim().length > 0);
    if (validBooks.length < 2) {
      Alert.alert("Needs more books", "Enter at least 2 books to spin!");
      return;
    }

    setStatus("spinning");

    let currentIndex = 0;
    let speed = 50;
    let stopThreshold = 600;

    const runLoop = () => {
      setCurrentDisplayBook(validBooks[currentIndex]);

      currentIndex = (currentIndex + 1) % validBooks.length;

      if (speed < stopThreshold) {
        speed = speed * 1.1;
        setTimeout(runLoop, speed);
      } else {
        finishSpin(validBooks[currentIndex === 0 ? validBooks.length - 1 : currentIndex - 1]);
      }
    };

    runLoop();
  };

  const finishSpin = (winner: string) => {
    setCurrentDisplayBook(winner);
    setStatus("won");

    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const reset = () => {
    setBooks(["", ""]);
    setStatus("idle");
    setCurrentDisplayBook("");
    scaleAnim.setValue(0.5);
    opacityAnim.setValue(0);
  };

  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Book Roulette</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={20} color="#8B7355" />
            </TouchableOpacity>
          </View>

          {/* Content area */}
          <View style={styles.contentArea}>
            {status === "idle" && (
              <View style={styles.inputList}>
                <Text style={styles.subtitle}>Enter your options:</Text>
                {books.map((book, index) => (
                  <View key={index} style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder={`Book ${index + 1}`}
                      value={book}
                      onChangeText={(text) => handleTextChange(text, index)}
                    />
                    {books.length > 2 && (
                      <TouchableOpacity onPress={() => removeBookField(index)}>
                        <IconSymbol name="minus.circle.fill" size={22} color="#EBB" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {books.length < 10 && (
                  <TouchableOpacity style={styles.addBtn} onPress={addBookField}>
                    <IconSymbol name="plus" size={16} color="#8B7355" />
                    <Text style={styles.addBtnText}>Add option</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {status === "spinning" && (
              <View style={styles.centerStage}>
                <Text style={styles.spinningLabel}>Picking your destiny...</Text>
                <Text style={styles.cyclingText}>{currentDisplayBook}</Text>
              </View>
            )}

            {status === "won" && (
              <Animated.View style={[styles.centerStage, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.winnerText}>The universe wants you to read:</Text>
                <View style={styles.winnerCard}>
                  <Text style={styles.winnerTitle}>{currentDisplayBook}</Text>
                </View>
              </Animated.View>
            )}
          </View>

          <View style={styles.footer}>
            {status === "idle" && (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSpin}>
                <Text style={styles.btnText}>Pick for me!</Text>
              </TouchableOpacity>
            )}

            {status === "won" && (
              <View style={styles.row}>
                <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={reset}>
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSpin}>
                  <Text style={styles.btnText}>Spin Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFF8F3",
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
  },
  closeBtn: {
    padding: 5,
    backgroundColor: "#F0E6D8",
    borderRadius: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#8B7355",
    marginBottom: 10,
  },
  contentArea: {
    minHeight: 200,
    justifyContent: "center",
  },
  inputList: {
    gap: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F5E6D3",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#2D3436",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#D4C5B0",
    borderStyle: "dashed",
    borderRadius: 12,
    marginTop: 5,
    gap: 5,
  },
  addBtnText: {
    color: "#8B7355",
    fontWeight: "600",
  },
  centerStage: {
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  },
  spinningLabel: {
    fontSize: 16,
    color: "#8B7355",
    fontStyle: "italic",
  },
  cyclingText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FF6B8B",
    textAlign: "center",
  },
  winnerText: {
    fontSize: 16,
    color: "#8B7355",
    fontWeight: "600",
  },
  winnerCard: {
    backgroundColor: "#FF6B8B",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 16,
    shadowColor: "#FF6B8B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  winnerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
  },
  footer: {
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: "#FF6B8B",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  btnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },
  secondaryBtnText: {
    color: "#8B7355",
    fontWeight: "600",
    fontSize: 16,
  }
});