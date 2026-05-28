<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceRule extends Model
{
    protected $fillable = [
        'rule_name',
        'check_in_start',
        'check_in_end',
        'check_out_start',
        'check_out_end',
        'late_after',
    ];
}