const std = @import("std");

const memory_size = 256;
const commands_encoding = "+-><[],.";
const Iterations = usize;
pub fn Program(comptime T: type) type {
    if (@typeInfo(T) != .Int) @compileError("You must pass a number type");
    return struct {
        const Self = @This();
        const Instruction = enum(u3) {
            const Args = @Type(std.builtin.Type{ .Int = .{
                .signedness = .unsigned,
                .bits = @typeInfo(T).Int.bits - 3,
            } });
            inc = 0b000,
            dec = 0b001,
            dinc = 0b010,
            ddec = 0b011,
            iinc = 0b100,
            idec = 0b101,
            input = 0b110,
            output = 0b111,
            fn getInstruction(cell: T) Instruction {
                return @enumFromInt(@as(u3, @truncate(cell >> 5)));
            }
            fn getArgs(cell: T) Args {
                return @as(Args, @truncate(cell));
            }
            fn process(cell: T) struct { inst: Instruction, args: Args } {
                return .{ .inst = getInstruction(cell), .args = getArgs(cell) };
            }
        };
        memory: []T = undefined,
        allocator: std.mem.Allocator = undefined,
        dp: usize = 0,
        ip: usize = 0,
        pub fn initMemory(self: *Self, size: usize, allocator: std.mem.Allocator) !void {
            self.memory = try allocator.alloc(T, size);
            @memset(self.memory, 0);
            self.allocator = allocator;
        }
        pub fn loadProgram(self: *Self, file: []const u8) !void {
            var program = try std.fs.cwd().openFile(file, .{});
            _ = try program.readAll(self.memory);
            program.close();
        }
        pub fn deinit(self: *Self) void {
            self.allocator.free(self.memory);
        }
        pub fn run(self: *Self, in: anytype, out: anytype) !Iterations {
            var iterations: Iterations = 0;
            while (true) : (iterations += 1) {
                const instruction = Instruction.process(self.memory[self.ip % self.memory.len]);
                const change = @as(T, instruction.args) +% 1;
                const current_memory = &self.memory[self.dp % self.memory.len];

                switch (instruction.inst) {
                    .inc => current_memory.* +%= change,
                    .dec => current_memory.* -%= change,
                    .dinc => self.dp +%= change,
                    .ddec => self.dp -%= change,
                    .iinc => {
                        if (current_memory.* == 0) {
                            self.ip +%= change;
                            continue;
                        }
                    },
                    .idec => {
                        if (current_memory.* != 0) {
                            self.ip -%= change;
                            continue;
                        }
                    },
                    .input => {
                        current_memory.* = read: while (in.readByte() catch null) |byte| {
                            if (byte == '\r') continue else break :read byte;
                        } else current_memory.*;
                    },
                    .output => {
                        if (instruction.args == 0) return iterations;
                        try out.writeByte(current_memory.*);
                    },
                }
                self.ip +%= 1;
            }
            return iterations;
        }
        fn diagnosis(self: Self) void {
            const instruction = Instruction.process(self.memory[self.ip % self.memory.len]);
            const change = instruction.args +% 1;
            const current_memory = &self.memory[self.dp % self.memory.len];
            std.debug.print("Machine code: {b:0>8}, Instruction: {s}, argument: {}, ip: {}, dp: {}, data: {c} {} {b:0>8}\n", .{ self.memory[self.ip % self.memory.len], switch (instruction.inst) {
                .inc => "+",
                .dec => "-",
                .dinc => ">",
                .ddec => "<",
                .iinc => "[",
                .idec => "]",
                .input => ",",
                .output => ".",
            }, change, self.ip % self.memory.len, self.dp % self.memory.len, current_memory.*, current_memory.*, current_memory.* });
            std.time.sleep(5 * 500 * 1000);
        }
    };
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer {
        if (gpa.deinit() == std.heap.Check.leak) {
            std.log.err("Memory leak detected!", .{});
        }
    }
    const allocator = gpa.allocator();
    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    const writer = std.io.getStdOut().writer();
    const reader = std.io.getStdIn().reader();

    if (args.len == 1) return enterInterativeMode(allocator, reader, writer);
    const Verb = enum { run, compile };
    const verb = std.meta.stringToEnum(Verb, args[1]);
    try if (verb) |v| switch (v) {
        .run => runProgram(allocator, args[2], reader, writer),
        .compile => compileProgram(u8, allocator, args[2], args[3]),
    } else writer.writeAll("Unrecognized command\n");
}

fn enterInterativeMode(allocator: std.mem.Allocator, in: anytype, out: anytype) !void {
    _ = allocator;
    _ = in;
    try out.writeAll("Interactive mode not implemented yet. \n");
}

pub fn runProgram(allocator: std.mem.Allocator, file_name: []const u8, in: anytype, out: anytype) !void {
    var program = Program(u8){};

    try program.initMemory(memory_size, allocator);
    defer program.deinit();

    program.loadProgram(file_name) catch {
        std.debug.print("Error loading the program.\n", .{});
        return;
    };
    var clock = try std.time.Timer.start();
    const iterations = try program.run(in, out);
    const time = clock.lap();
    std.debug.print("\n\nTime elapsed: {}.{}ms\n{} iterations\n", .{ time / std.time.ns_per_ms, time % std.time.ns_per_ms, iterations });

    std.debug.print("dp: {}, ip: {}, delta: {}, last instruction: {d}, last cell: {d}, Memory dump: \n{d}\n{s}", .{ program.dp % memory_size, program.ip % memory_size, (std.math.sub(usize, program.dp, program.ip) catch program.ip - program.dp) % memory_size, program.memory[program.ip % memory_size], program.memory[program.dp % memory_size], program.memory, program.memory });
}

pub fn compileProgram(comptime T: type, allocator: std.mem.Allocator, input_file_name: []const u8, output_file_name: []const u8) !void {
    std.debug.assert(@typeInfo(T) == .Int);
    var input_file = try std.fs.cwd().openFile(input_file_name, .{});
    var input = try input_file.readToEndAlloc(allocator, 4096);
    defer allocator.free(input);
    input_file.close();
    var output = try std.fs.cwd().createFile(output_file_name, .{});
    defer output.close();
    var iterator = std.mem.tokenizeAny(T, input, "\n\r");
    line_loop: while (iterator.next()) |line| {
        var line_iterator = std.mem.tokenizeScalar(T, line, ' ');
        var last_index = line_iterator.index;
        while (line_iterator.next()) |token| {
            std.debug.print("current token: {s}\n", .{token});
            const char = token[0];
            var result: ?T = null;
            if (std.mem.indexOfScalar(T, commands_encoding, char)) |_| {
                result = try compileCommand(T, token);
            } else if (char == '!') continue :line_loop else if (std.mem.indexOfScalar(T, "\"'", char) != null) {
                line_iterator.index += try compileString(line[1 + last_index ..], output);
                if (line_iterator.index > line_iterator.buffer.len) line_iterator.index = line_iterator.buffer.len;
                continue;
            } else if (std.ascii.isDigit(char)) {
                result = try compileNumber(T, token);
            }
            try output.writeAll(&.{result orelse return error.InvalidToken});
            std.debug.print("{b:0>8}\n", .{result.?});
            last_index = line_iterator.index;
        }
    }
    const exe_size = try output.getPos();
    std.debug.print("File size: {}\nProjected free memory: {}\n", .{exe_size, memory_size - exe_size});
    if (try output.getPos() > memory_size) return error.ExecutableTooBig;
}

fn compileCommand(comptime T: type, input: []const u8) !T {
    std.debug.print("compiling command {s}\n", .{input});
    const last_command_with_default_arg_1 = 5;
    const args_size = @typeInfo(T).Int.bits - 3;
    const ArgsType = @Type(std.builtin.Type{ .Int = .{
        .signedness = .unsigned,
        .bits = args_size,
    } });

    const maybe_command = std.mem.indexOfScalar(u8, commands_encoding, input[0]);
    if (maybe_command) |command| {
        const assembly_command = @as(u8, @truncate(command << args_size));
        var arg_idx: usize = 0;
        const arg_value = if (1 < input.len and std.ascii.isDigit(input[arg_idx + 1])) blk: {
            arg_idx += 1;
            while (arg_idx < input.len and std.ascii.isDigit(input[arg_idx])) arg_idx += 1;
            break :blk std.fmt.parseInt(ArgsType, input[1..arg_idx], 0) catch |err| {
                switch (err) {
                    error.Overflow => std.debug.print("Argument too big, max supported argument is 31", .{}),
                    else => std.debug.print("Unexpected error: {!}", .{err}),
                }
                return err;
            };
        } else if (command <= last_command_with_default_arg_1) @as(ArgsType, 1) else @as(ArgsType, 0);
        if (command <= last_command_with_default_arg_1) {
            return if (arg_value > 0) assembly_command + (arg_value - 1) else assembly_command + std.math.maxInt(ArgsType);
        } else return assembly_command + arg_value;
    } else unreachable;
}

fn compileString(input: []const u8, output: anytype) !usize {
    std.debug.print("compiling string {s}\n", .{input});
    const quote = input[0];
    var end = std.mem.indexOfScalar(u8, input[1..], quote) orelse return error.InvalidSyntax;
    end += 1;
    std.debug.print("string: \"{s}\"\n", .{input[1..end]});
    try output.writeAll(input[1..end]);
    return end;
}

fn compileNumber(comptime T: type, input: []const u8) !T {
    std.debug.print("compiling number {s}\n", .{input});
    return std.fmt.parseInt(T, input, 0);
}
