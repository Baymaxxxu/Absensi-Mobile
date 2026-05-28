<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function checkIn(Request $request)
    {
        $request->validate([
            'check_in_latitude' => 'required|numeric',
            'check_in_longitude' => 'required|numeric',
            'check_in_photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $user = $request->user();
        $employee = $user->employee;

        if (! $employee) {
            return response()->json([
                'message' => 'Data karyawan tidak ditemukan.',
            ], 404);
        }

        $today = Carbon::today()->toDateString();

        $existingAttendance = Attendance::where('employee_id', $employee->id)
            ->where('attendance_date', $today)
            ->first();

        if ($existingAttendance && $existingAttendance->check_in_time) {
            return response()->json([
                'message' => 'Kamu sudah melakukan check-in hari ini.',
                'attendance' => $existingAttendance,
            ], 400);
        }

        $workLocation = $employee->workLocation;

        if (! $workLocation) {
            return response()->json([
                'message' => 'Lokasi kerja karyawan belum diatur.',
            ], 400);
        }

        $distance = $this->calculateDistance(
            $request->check_in_latitude,
            $request->check_in_longitude,
            $workLocation->latitude,
            $workLocation->longitude
        );

        $checkInStatus = $distance <= $workLocation->radius_meter ? 'valid' : 'invalid';

        $now = Carbon::now();

        $status = $now->format('H:i:s') > '08:00:00' ? 'terlambat' : 'hadir';

        $notes = [];

        if ($status === 'terlambat') {
            $notes[] = 'Karyawan terlambat check-in.';
        }

        if ($checkInStatus === 'invalid') {
            $notes[] = 'Lokasi check-in berada di luar radius kerja.';
        }

        $checkInPhotoPath = null;
        if ($request->hasFile('check_in_photo')) {
        $checkInPhotoPath = $request->file('check_in_photo')->store('attendance_photos/check_in', 'public');
        }

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'attendance_date' => $today,
            'check_in_time' => $now->format('H:i:s'),
            'check_in_latitude' => $request->check_in_latitude,
            'check_in_longitude' => $request->check_in_longitude,
            'check_in_photo' => $checkInPhotoPath,
            'check_in_status' => $checkInStatus,
            'status' => $status,
            'notes' => count($notes) > 0 ? implode(' ', $notes) : null,
        ]);

        return response()->json([
            'message' => 'Check-in berhasil.',
            'distance_meter' => round($distance, 2),
            'allowed_radius_meter' => $workLocation->radius_meter,
            'check_in_status' => $checkInStatus,
            'check_in_photo_url' => $attendance->check_in_photo
                ? asset('storage/' . $attendance->check_in_photo)
                : null,
            'attendance' => $attendance,
        ]);
    }

    public function checkOut(Request $request)
    {
        $request->validate([
            'check_out_latitude' => 'required|numeric',
            'check_out_longitude' => 'required|numeric',
            'check_out_photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $user = $request->user();
        $employee = $user->employee;

        if (! $employee) {
            return response()->json([
                'message' => 'Data karyawan tidak ditemukan.',
            ], 404);
        }

        $today = Carbon::today()->toDateString();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('attendance_date', $today)
            ->first();

        if (! $attendance) {
            return response()->json([
                'message' => 'Kamu belum melakukan check-in hari ini.',
            ], 400);
        }

        if ($attendance->check_out_time) {
            return response()->json([
                'message' => 'Kamu sudah melakukan check-out hari ini.',
                'attendance' => $attendance,
            ], 400);
        }

        $workLocation = $employee->workLocation;

        if (! $workLocation) {
            return response()->json([
                'message' => 'Lokasi kerja karyawan belum diatur.',
            ], 400);
        }

        $distance = $this->calculateDistance(
            $request->check_out_latitude,
            $request->check_out_longitude,
            $workLocation->latitude,
            $workLocation->longitude
        );

        $checkOutStatus = $distance <= $workLocation->radius_meter ? 'valid' : 'invalid';

        $notes = [];

        if ($attendance->notes) {
            $notes[] = $attendance->notes;
        }

        if ($checkOutStatus === 'invalid') {
            $notes[] = 'Lokasi check-out berada di luar radius kerja.';
        }

        $checkOutPhotoPath = null;
        if ($request->hasFile('check_out_photo')) {
        $checkOutPhotoPath = $request->file('check_out_photo')->store('attendance_photos/check_out', 'public');
        }

        $attendance->update([
            'check_out_time' => Carbon::now()->format('H:i:s'),
            'check_out_latitude' => $request->check_out_latitude,
            'check_out_longitude' => $request->check_out_longitude,
            'check_out_photo' => $checkOutPhotoPath,
            'check_out_status' => $checkOutStatus,
            'notes' => count($notes) > 0 ? implode(' ', $notes) : null,
        ]);

        return response()->json([
            'message' => 'Check-out berhasil.',
            'distance_meter' => round($distance, 2),
            'allowed_radius_meter' => $workLocation->radius_meter,
            'check_out_status' => $checkOutStatus,
            'check_out_photo_url' => $attendance->check_out_photo
                ? asset('storage/' . $attendance->check_out_photo)
                : null,
            'attendance' => $attendance,
        ]);
    }

    public function history(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        if (! $employee) {
            return response()->json([
                'message' => 'Data karyawan tidak ditemukan.',
            ], 404);
        }

        $attendances = Attendance::where('employee_id', $employee->id)
            ->orderBy('attendance_date', 'desc')
            ->get();

        return response()->json([
            'message' => 'Riwayat absensi berhasil diambil.',
            'attendances' => $attendances,
        ]);
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000;

        $lat1 = deg2rad($lat1);
        $lon1 = deg2rad($lon1);
        $lat2 = deg2rad($lat2);
        $lon2 = deg2rad($lon2);

        $latDelta = $lat2 - $lat1;
        $lonDelta = $lon2 - $lon1;

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos($lat1) * cos($lat2) *
            sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}