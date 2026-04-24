<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('server_egg_switch_overrides', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('server_id');
            $table->unsignedInteger('target_egg_id');
            $table->boolean('allowed');
            $table->boolean('preserves_files')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->unique(['server_id', 'target_egg_id'], 'server_egg_switch_overrides_server_target_unique');

            $table->foreign('server_id')
                ->references('id')->on('servers')
                ->cascadeOnDelete();
            $table->foreign('target_egg_id')
                ->references('id')->on('eggs')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('server_egg_switch_overrides');
    }
};
