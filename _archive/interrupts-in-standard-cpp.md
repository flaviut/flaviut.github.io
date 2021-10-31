Interrupts in standard C++
==========================

Jul 23, 2018

by Mikael Rosbacke

Introduction
------------

So you have this new microcontroller you want to use C++ on. How do we know your interrupt code behaves with modern compilers and newer standards?

The evolution of compilers means they are getting better at optimizing standard compliant code. The side effect is that non-compliant code just gets more and more likely to be broken as time and compiler versions pass by.

Interrupts are a foreign concept to the standard. So we will have to rely on toolchain specific extensions to make interrupts workable and can you truly say you know your environment?

When C++ 11 was adopted we got the new memory model. Suddenly we could reason about threads in a standard compliant way and code written for one system could be used in others without having to worry about portability issues relating to threads. In the best of worlds at least.

So one desired property when we start writing non-standard code for interrupts is to at least know the constraints we are operating under. If so, we could grab some standard library, review the code to see if it fulfills these and if it checks out, use it.

In the long run, we could also start building interrupt related primitives that taste and feel like normal C/C++ code. We hide everything system dependent in them and use them with normal portable code. Much like mutexes can make single-threaded code become safe in a multi-threading environment.

Also, a reason for this is to allow your code to exist in several systems. There are many reasons to want your microcontroller code to also work as a simulation in your Linux system. Initially maybe only as a testing and code quality tool, but later it could be a migration path to more powerful hardware.

Interrupts modeled as a thread
------------------------------

So let us start by assuming we can treat interrupt based code as a thread. What would it give us? An interrupt breaks the running of a thread, does its thing and then return to the thread. From the thread perspective, this is no different from being scheduled from a kernel. This should be the same.

However, an interrupt usually runs on the same stack as the thread. It can not be blocked since that would block the entire thread. In particular, it can not try to acquire mutexes if there is a chance that mutex is locked from the thread below it. The only way to have a thread protecting itself from a thread is to disable its start. Once that is done you can change some data atomically and then reenable the interrupt.

### Thread interrupt start / stop.

When a thread is started, it is started from some other thread via the std::thread object constructor. This is a synchronization point between these 2 threads. In contrast, an interrupt is a hardware induced context switch. Here we will need some explicit synchronization between the running thread and the newly started interrupt. Conversely when the interrupt ends, if it changed some variables, it needs to synchronize with the thread before the thread can access these variables.

An additional note on the startup. The compiler generally only expects main() to be the top level function. If it can deduce that nobody is calling an interrupt function it can remove it. There is a need to somehow tell the compiler that there might be calls to the interrupt service function, potentially from another thread, especially if link-time optimization is enabled. This will prevent that type of optimizations.

Once the interrupt has started it is very similar to a thread. It itself can be interrupted from higher level interrupts. In particular, the same rules about synchronization of data between threads should hold for interrupt/thread communication.

So, could we build up a synchronization primitive similar to a Mutex, but intended for protecting sections of code between an interrupt and a thread, we could write very normal looking code. This primitive would need to have a system dependent implementation to handle the protection and synchronization needs for a particular platform.

### Generalized model of interrupts

Often interrupts comes in several priorities. Also in RTOSes, there are thread priorities where a higher priority thread will strictly run before a lower priority thread. If we ban context switching between equal level threads and interrupts we can actually run this on a single stack. In this setting, I will use the word *Task* to refer to either a thread or an interrupt. They form a continuous space separated by priority where interrupts are always higher prioritized than threads.

This is a fully asymmetric system. In this case, our primitive should allow a low-level Task to set up a critical section where it knows it can change data without being interrupted. The other side can just run on without risk of interruption from below. On the other hand, it might also need to protect itself from above. The other requirement it has is to ensure synchronization of data between tasks. We approximate that all our tasks can be viewed as standard C++ threads so the normal synchronization rules between threads should apply.

Let us start designing a new primitive called a 'Cover'. It is the analog of a mutex in the asymmetric case. The name Mutex is short for 'mutual exclusion' and there is nothing mutual here. The name 'cover' means it should cover, shield or protect accesses to shared variables between task.

To implement this, we will need the standard tools to perform synchronization between threads. These are part of the C++ standard in terms of std::atomic_thread_fence which can be had in acquire and release variants. Getting a cover means doing an acquire fence and releasing the cover means doing a release fence. This will allow us to operate within the boundaries of what is expected by C++ thread functions.

Now to handle the protection part, we need system dependent primitives to enable/disable running of tasks. These are 2 functions that will be a customization point. It is expected that on a microcontroller they will map to e.g. enable/disable_irq functions or similar. Also, the call to synchronize memory should be a customization point since many microcontrollers have much stronger memory subsystems compared to the general case for C/C++.

```
// Interface to our cover class.
template<typename System>
class cover : System
{
public:
    // Called by low priority task to start/end a critical section.
    void protect() { System::protect(); }
    void unprotect() { System::unprotect(); }

    // Called by a high priority task to start/end a synchronization region.
    void sync() { System::sync(); }
    void unsync() { System::unsync(); }
};

```

As can be seen, the asymmetric relationship means 2 different sets of functions. The Protect set does double duty of protecting a section of code and forming synchronization of variables inside. The sync variants only perform the synchronization.

In addition, we want the traditional RAII style lock/unlock classes.

```
template<typename Cover>
class protect_lock {
    Cover& m_c;
public:
    protect_lock(Cover& c) : m_c(c) { c.protect(); }
    ~protect_lock() { m_c.unprotect(); }
};

template<typename Cover>
class sync_lock {
    Cover& m_c;
public:
    sync_lock(Cover& c) : m_c(c) { c.sync(); }
    ~sync_lock() { m_c.unsync(); }
};

```

So typical use of this would be to have your main() function constructing a protect_lock in a scope where it touches common data that an interrupt is also accessing. The interrupt would use a sync_lock or a protect_lock depending on if it needs to protect from other interrupts or not.

Just using this, the following example should be viable on an ARM Cortex-M4 microcontroller:

```
using Cover = cover<armv7_m::cover>;
static Cover cov;
static unsigned count;

extern "C" void SysTickHandler(void)
{
    sync_lock<Cover> lk(cov);
    count++;
}

int main()
{
    setupSysTick();
    while(1) {
        bool odd;
        {
            protect_lock<Cover> lk;
            odd = (count & 1) != 0;
        }
        setLed(odd);
    }
}

```

Here we set up a SysTick interrupt function that should be called at regular intervals to update the count variable. The main loop busy polls this variable and does something with the value. All the enable/disable interrupt and synchronization is now relegated to the cover class. With the slightest of optimization turned on everything related to the cover is inlined and we get the same code as by writing out all protection directly in the functions.

Now suppose we wanted to simulate this in a Linux environment. We set up some extra threads with real-time priority to act as interrupts. The only thing needed to change here is the cover class. The actual logic of the code stays unchanged.

### Case study, requirements on the ArmV7-M platform.

So assume we have our cortex-m4 microcontroller. This implements the ARMv7-M architecture which specifies all the fine print regarding hardware memory models, assembler instructions sets etc. What is needed to make this work? First off, I assume a gcc compiler. It is the collaboration between the compiler and the actual hardware that is 'the other side' of the programming language specification. So for the protection part, we will keep it simple and globally do enable/disable interrupt. You can get fancy and use e.g. device specific interrupt blocking och blocking below a threshold, but it is overkill. Do note that several types of covers using different strategies can coexist in a program. So the following could work:

```
// ARMV7-M implementation of cover
namespace armv7-m {
class cover
{
public:
    void protect() { __disable_irq(); sync(); }
    void unprotect() { unsync(); __enable_irq(); }

    void sync() { std::atomic_thread_fence(std::memory_order::acquire); }
    void unsync() { std::atomic_thread_fence(std::memory_order::release); }
};
}

```

The standard fences will be compiled into an assembly instruction 'dmb ish' which tells the hardware to sync up its memory before continuing. Both the acquire and release are treated the same way. The compiler will also know that this is an externally visible effect so it won't reorder memory accesses past this point. The enable_irq and disable_irq are supplied by ARM specific headers and inserts assembler instructions 'cpsie' and 'cpsid'.

So compiling this will generate code with proper disabling of interrupts and synchronization via 'dmb ish'. But looking at the disassembly, it does seem a bit excessive. There are a number of unneeded 'dmb ish' instructions.

If one further studies the ARMv7-M manual one realizes that the cpsie, cpsid assembly instructions will perform all the needed hardware memory synchronization. Further, an interrupt will make the memory subsystem consistent. However, we are not sure that the enable/disable interrupts are valid compiler barriers. All the compiler know if that our variables are regular memory accesses that should not be affected by whatever assembly we insert. So to be on the safe side we should use a compiler barrier. For gcc it could look like:

```
__asm__ volatile("": : :"memory");

```

It is an inline assembly call without any instructions. But since it is volatile, gcc will not move load and stores of memory across it and inside our protected section. Do note that this is invisible at runtime, it only affects how the code is laid out at compile time.

A side note: there exist an std::atomic_signal_fence in addition to std::atomic_thread_fence. It has a similar function but requires the synchronization to be done between a thread and a signal_handler on the same stack. If we can guarantee that, it can be useful. Using this when we simulate interrupts with another thread would be illegal. Also, equating a C/C++ signal handler (a Unix concept) with a microcontroller interrupt service routine is probably true, but I have not seen a definitive statement that it is. It is a grey area.

So, this cover implementation should suffice and generate less code:

```
// ARMV7-M implementation of cover, improved.
namespace armv7-m {
class cover
{
public:
    void protect() { __disable_irq(); sync(); }
    void unprotect() { unsync(); __enable_irq(); }

    void sync() { __asm__ volatile("": : :"memory"); }
    void unsync() { __asm__ volatile("": : :"memory"); }
};
}

```

### Linux simulation case

In the case of a Linux simulation we do not have interrupts, rather we use threads to simulate them. Even if we have real-time threads, we can actually lock them in this case. Hence the easy way here is to implement the cover in terms of a mutex.

```
// Linux implementation of cover.
namespace linux {
class cover
{
public:
    void protect() { m_.lock(); }
    void unprotect() { m_.unlock(); }

    void sync() { m_.lock(); }
    void unsync() { m_.unlock(); }
private:
    std::mutex m_;
};
}

```

Here we rely on interrupts being simulated by a thread and can be blocked so a mutex is ok. At the same time, we fall back to the mutex to provide all the guarantees needed to avoid data-races.

Atomic variables
----------------

In addition to mutexes, we have atomic variables. Looking at the standard atomics have the following properties:

-   Read and writes are atomic, that is observed from other threads, an operation is either fully seen or not at all. No sheared writes are seen.

-   An atomic is externally visible. A thread must assume some other thread can observe its value.

-   Depending on memory order, an operation on an atomic participates in inter-thread synchronization.

So in our example, we could replace to 'count' variable with an atomic<unsigned> and then we could drop all the use of the Cover object.

```
static std::atomic<unsigned> count;

extern "C" void SysTickHandler(void)
{
    // Note, can get away with several atomic operations. The thread is blocked.
    auto t = count.load();
    count.store(++t);
}

int main()
{
    setSysTick();
    assert(atomic_is_lock_free(&count));
    while(1) {
        bool odd = (count.load() & 1) != 0;
        setLed(odd);
    }
}

```

Less code which is good. Do note the assert in the main function. We need lock-free atomics for this to work. The C++ standard says the compiler can insert locks to implement atomics. For most systems where primitive read and writes are 'all or nothing' compilers will generate lock free accesses. But to be portable we need to check this.

How do we make sure we can always use atomic variables even when they are not lockless? We need our own. Let it use the builtins if they work, but do a custom implementation if not. We have previously used disable/enable interrupt to protect a memory area. Let us use that one.

What do we need:

-   For atomicity: all or nothing. If the particular system can not guarantee it, use disable/enable interrupt to fulfill this guarantee.

-   For external visibility: We need some way to inform the compiler that a read/writes can be observed. One way to achieve this is 'volatile' accesses or some other compiler dependent mean.

-   We need to look at the synchronization operation. We might need to use the fences to implement synchronization between threads and allow these to induce ordering between non-atomic accesses on other variables.

### Example: Cortex-M3, or ArmV7-M architecture.

The Cortex-M3 is based on the ArmV7-M architecture. When gcc is used to compile the code it claims to always be lock-free for primitive atomic types. So in this case, the built-in operations work. Do note that this includes stuff like ++ , &=, etc. These are read/modify/write operations. How does the compiler do this? It uses the special instructions LDREX, STREX. These are synchronization primitives where the LDREX loads a value and starts an exclusive transaction. STREX stores a value *if* nobody else has touched the target area since the start. It returns a boolean telling if it succeeded or not. Doing a small loop that tests this and repeats on failure, you can get atomic multi-step operations. If we use the compiler generated atomics we get all the other properties also (synchronization etc) for free.

### Example: Cortex-M0, or ArmV6-M architecture.

This architecture lacks the LDREX / STREX operations so atomics cannot guarantee atomic operations on read/modify/write operations. However, the simple load/store of a value are atomic (if they are aligned). So here we probably need to implement our own atomic. The simple load and store work so simply do that. But read/modify/write operations would need to disable/enable interrupts to be atomically safe. So here we will need to manually handle the external visibility property (possibly using volatile).

For the Synchronization the Cortex-M0 is a very strongly coupled memory system so a compiler barrier should suffice as synchronization.

Conclusion
----------

Reasoning from the C/C++ 11 standard memory models and comparing interrupts to threads we can derive some requirements that allow us to reason about interrupts within the standards. This allows us to write fairly portable code and concentrate the system dependent parts into synchronization primitives such as the Cover and atomic variables. This opens the door to do Linux based simulation of microcontroller code. We can also see that our synchronization primitives approach the traditional enable/disable interrupts and volatiles when running on in-order microcontrollers such as the Cortex-M0. However modern compilers do need compiler barriers and for more evolved microcontrollers there can be a need for memory synchronization (e.g. the "dmb ish" instruction.) Do note that this assumes a C/C++ standard of year 11 or later. The earlier standards don't touch on the subjects. They might work but don't need to. Check your compiler manual.
