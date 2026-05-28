import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

// GANTI kalau IP laptop kamu berubah
const API_URL = "http://172.20.10.4:8000/api";

type Attendance = {
  id: number;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_status: string | null;
  check_out_status: string | null;
  status: string;
  notes: string | null;
  check_in_photo: string | null;
  check_out_photo: string | null;
};

export default function HistoryScreen() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Belum login", "Silakan login terlebih dahulu.");
        return;
      }

      const response = await axios.get(`${API_URL}/attendance-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      setAttendances(response.data.attendances || []);
    } catch (error: any) {
      console.log("HISTORY ERROR:", error.message);
      console.log("HISTORY RESPONSE:", error.response?.data);

      Alert.alert(
        "Gagal mengambil riwayat",
        error.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceHistory();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAttendanceHistory();
    }, [])
  );

  const formatStatus = (status: string | null) => {
    if (!status) return "-";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderItem = ({ item }: { item: Attendance }) => {
    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.date}>{item.attendance_date}</Text>
          <View
            style={[
              styles.badge,
              item.status === "terlambat" ? styles.badgeLate : styles.badgeOk,
            ]}
          >
            <Text style={styles.badgeText}>{formatStatus(item.status)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Check-in</Text>
          <Text style={styles.value}>{item.check_in_time || "-"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Check-out</Text>
          <Text style={styles.value}>{item.check_out_time || "-"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Status lokasi masuk</Text>
          <Text style={styles.value}>{formatStatus(item.check_in_status)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Status lokasi pulang</Text>
          <Text style={styles.value}>{formatStatus(item.check_out_status)}</Text>
        </View>

        {item.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Catatan</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.photoInfoBox}>
          <Text style={styles.photoInfo}>
            Foto masuk: {item.check_in_photo ? "Ada" : "Belum ada"}
          </Text>
          <Text style={styles.photoInfo}>
            Foto pulang: {item.check_out_photo ? "Ada" : "Belum ada"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Absensi</Text>
        <Text style={styles.subtitle}>Data absensi karyawan</Text>
      </View>

      {loading && attendances.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Mengambil data...</Text>
        </View>
      ) : (
        <FlatList
          data={attendances}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Belum ada riwayat</Text>
              <Text style={styles.emptyText}>
                Data absensi akan muncul setelah kamu melakukan check-in.
              </Text>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchAttendanceHistory}
              >
                <Text style={styles.refreshButtonText}>Muat Ulang</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeOk: {
    backgroundColor: "#DCFCE7",
  },
  badgeLate: {
    backgroundColor: "#FEF3C7",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    textAlign: "right",
    flex: 1,
  },
  notesBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: "#4B5563",
  },
  photoInfoBox: {
    marginTop: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
  },
  photoInfo: {
    fontSize: 13,
    color: "#1D4ED8",
    fontWeight: "600",
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#6B7280",
    fontSize: 14,
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 18,
  },
  refreshButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});