<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'user_id',
        'employee_code',
        'phone',
        'position',
        'outsource_company',
        'work_location_id',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function workLocation()
    {
        return $this->belongsTo(WorkLocation::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}