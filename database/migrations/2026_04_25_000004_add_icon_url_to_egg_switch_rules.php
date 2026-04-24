<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('egg_switch_rules', function (Blueprint $table) {
            $table->string('icon_url', 2048)->nullable()->after('warning_copy');
        });
    }

    public function down(): void
    {
        Schema::table('egg_switch_rules', function (Blueprint $table) {
            $table->dropColumn('icon_url');
        });
    }
};
