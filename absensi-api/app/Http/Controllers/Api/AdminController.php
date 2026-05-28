<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    private function checkAdmin(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Akses ditolak. Hanya admin yang dapat mengakses fitur ini.'
            ], 403);
        }

        return null;
    }

    public function employees(Request $request)
    {
        $adminCheck = $this->checkAdmin($request);

        if ($adminCheck) {
            return $adminCheck;
        }

        $employees = Employee::with(['user', 'workLocation'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'message' => 'Data karyawan berhasil diambil.',
            'employees' => $employees,
        ]);
    }

    public function employeeDetail(Request $request, $id)
    {
        $adminCheck = $this->checkAdmin($request);

        if ($adminCheck) {
            return $adminCheck;
        }

        $employee = Employee::with(['user', 'workLocation', 'attendances'])
            ->find($id);

        if (! $employee) {
            return response()->json([
                'message' => 'Data karyawan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Detail karyawan berhasil diambil.',
            'employee' => $employee,
        ]);
    }

    public function attendances(Request $request)
    {
        $adminCheck = $this->checkAdmin($request);

        if ($adminCheck) {
            return $adminCheck;
        }

        $query = Attendance::with(['employee.user', 'employee.workLocation'])
            ->orderBy('attendance_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('date')) {
            $query->where('attendance_date', $request->date);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $attendances = $query->get();

        return response()->json([
            'message' => 'Data absensi berhasil diambil.',
            'attendances' => $attendances,
        ]);
    }
}