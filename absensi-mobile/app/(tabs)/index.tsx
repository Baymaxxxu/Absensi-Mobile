import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// GANTI IP ini dengan IP laptop kamu dari: ipconfig getifaddr en0
const API_URL = "http://172.20.10.4:8000/api";

export default function HomeScreen() {
  const [email, setEmail] = useState("budi@gmail.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Peringatan", "Email dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const token = response.data.token;
      const userData = response.data.user;

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);

      Alert.alert("Berhasil", "Login berhasil.");
    } catch (error: any) {
      console.log("LOGIN ERROR:", error.message);
      console.log("LOGIN RESPONSE:", error.response?.data);

      Alert.alert(
        "Login gagal",
        error.response?.data?.message ||
          error.message ||
          "Tidak bisa terhubung ke server."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        await axios.post(
          `${API_URL}/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
      }
    } catch (error) {
      console.log("LOGOUT ERROR:", error);
    } finally {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setUser(null);
      setLastAction(null);
    }
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Izin lokasi ditolak",
        "Aplikasi membutuhkan akses lokasi untuk melakukan absensi."
      );
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Sesi habis", "Silakan login ulang.");
        setUser(null);
        return;
      }

      const location = await getCurrentLocation();

      if (!location) {
        return;
      }

      const response = await axios.post(
        `${API_URL}/check-in`,
        {
          check_in_latitude: location.latitude,
          check_in_longitude: location.longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const distance = response.data.distance_meter;
      const status = response.data.check_in_status;

      setLastAction(
        `Check-in berhasil. Status lokasi: ${status}. Jarak: ${distance} meter.`
      );

      Alert.alert("Berhasil", response.data.message);
    } catch (error: any) {
      console.log("CHECK-IN ERROR:", error.message);
      console.log("CHECK-IN RESPONSE:", error.response?.data);

      Alert.alert(
        "Check-in gagal",
        error.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan saat check-in."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Sesi habis", "Silakan login ulang.");
        setUser(null);
        return;
      }

      const location = await getCurrentLocation();

      if (!location) {
        return;
      }

      const response = await axios.post(
        `${API_URL}/check-out`,
        {
          check_out_latitude: location.latitude,
          check_out_longitude: location.longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const distance = response.data.distance_meter;
      const status = response.data.check_out_status;

      setLastAction(
        `Check-out berhasil. Status lokasi: ${status}. Jarak: ${distance} meter.`
      );

      Alert.alert("Berhasil", response.data.message);
    } catch (error: any) {
      console.log("CHECK-OUT ERROR:", error.message);
      console.log("CHECK-OUT RESPONSE:", error.response?.data);

      Alert.alert(
        "Check-out gagal",
        error.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan saat check-out."
      );
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Dashboard Karyawan</Text>
          <Text style={styles.subtitle}>Selamat datang,</Text>
          <Text style={styles.name}>{user.name}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>

            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{user.role}</Text>
          </View>

          {lastAction && (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{lastAction}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleCheckIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Check-in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Check-out</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Absensi Mobile</Text>
        <Text style={styles.subtitle}>Login karyawan outsource</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Masukkan email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Masukkan password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "center",
  },
  checkoutButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 16,
  },
  value: {
    fontSize: 15,
    color: "#111827",
    marginBottom: 8,
  },
  statusBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  statusText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "700",
  },
});