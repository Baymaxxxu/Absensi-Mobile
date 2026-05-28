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
            'check_in_photo' => 'nullable|string',
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

        $now = Carbon::now();

        $status = $now->format('H:i:s') > '08:00:00' ? 'terlambat' : 'hadir';

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'attendance_date' => $today,
            'check_in_time' => $now->format('H:i:s'),
            'check_in_latitude' => $request->check_in_latitude,
            'check_in_longitude' => $request->check_in_longitude,
            'check_in_photo' => $request->check_in_photo,
            'check_in_status' => 'valid',
            'status' => $status,
            'notes' => $status === 'terlambat' ? 'Karyawan terlambat check-in.' : null,
        ]);

        return response()->json([
            'message' => 'Check-in berhasil.',
            'attendance' => $attendance,
        ]);
    }

    public function checkOut(Request $request)
    {
        $request->validate([
            'check_out_latitude' => 'required|numeric',
            'check_out_longitude' => 'required|numeric',
            'check_out_photo' => 'nullable|string',
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

        $attendance->update([
            'check_out_time' => Carbon::now()->format('H:i:s'),
            'check_out_latitude' => $request->check_out_latitude,
            'check_out_longitude' => $request->check_out_longitude,
            'check_out_photo' => $request->check_out_photo,
            'check_out_status' => 'valid',
        ]);

        return response()->json([
            'message' => 'Check-out berhasil.',
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
}