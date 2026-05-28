<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AdminController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('/attendance-history', [AttendanceController::class, 'history']);

    Route::get('/admin/employees', [AdminController::class, 'employees']);
    Route::get('/admin/employees/{id}', [AdminController::class, 'employeeDetail']);
    Route::get('/admin/attendances', [AdminController::class, 'attendances']);
});