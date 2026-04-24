<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('egg_switch_rules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('source_egg_id')->nullable()->index();
            $table->unsignedInteger('target_egg_id')->index();
            $table->boolean('preserves_files')->default(false);
            $table->unsignedInteger('cooldown_minutes')->default(0);
            $table->text('warning_copy')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->unique(['source_egg_id', 'target_egg_id'], 'egg_switch_rules_source_target_unique');

            $table->foreign('source_egg_id')
                ->references('id')->on('eggs')
                ->nullOnDelete();
            $table->foreign('target_egg_id')
                ->references('id')->on('eggs')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('egg_switch_rules');
    }
};
