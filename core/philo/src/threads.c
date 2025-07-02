/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   threads.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/29 16:18:14 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 16:20:10 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "philosophers.h"

void	safe_mutex_handle(t_mutex *mutex, t_state mutex_state)
{
	if (LOCK == mutex_state)
		handle_mutex_error(pthread_mutex_lock(mutex), mutex_state);
	else if (UNLOCK == mutex_state)
		handle_mutex_error(pthread_mutex_unlock(mutex), mutex_state);
	else if (INIT == mutex_state)
		handle_mutex_error(pthread_mutex_init(mutex, NULL), mutex_state);
	else if (DESTROY == mutex_state)
		handle_mutex_error(pthread_mutex_destroy(mutex), mutex_state);
	else
		error_exit("Wrong mutex state for mutex handle");
}

void	safe_thread_handle(pthread_t *thread, void *(*foo) (void *),
	void *data, t_state thread_state)
{
	if (thread_state == CREATE)
		handle_thread_error(pthread_create(thread, NULL, foo, data),
			thread_state);
	else if (thread_state == JOIN)
		handle_thread_error(pthread_join(*thread, NULL), thread_state);
	else if (thread_state == DETACH)
		handle_thread_error(pthread_detach(*thread), thread_state);
	else
		error_exit("wrong state; can only use create, join, and detach");
}

void	handle_thread_error(int status, t_state thread_state)
{
	if (status == 0)
		return ;
	if (status == EAGAIN && thread_state == CREATE)
		error_exit("Insufficient resources to create another thread");
	else if (status == EINVAL && thread_state == CREATE)
		error_exit("invalid settings in attr");
	else if (status == EPERM)
		error_exit("No permission to set parameters of attr");
	else if (status == EINVAL && (thread_state == DETACH
			|| thread_state == JOIN))
		error_exit("thread is not a joinable thread");
	else if (status == EDEADLK && thread_state == JOIN)
		error_exit("A deadlock was detected");
	else if (status == ESRCH)
		error_exit("No thread with the ID thread could be found");
}

void	handle_mutex_error(int status, t_state mutex_state)
{
	if (status == 0)
		return ;
	if ((status == EINVAL) && (mutex_state == LOCK || mutex_state == UNLOCK))
		error_exit("error for locking / unlocking the mutex");
	else if (status == EDEADLK)
		error_exit("the current thread already owns the mutex");
	else if (status == EINVAL && mutex_state == INIT)
		error_exit("error with init function with the mutex");
	else if (status == EPERM && mutex_state == UNLOCK)
		error_exit("the mutex is a robust mutex ,check man");
	else if (status == EOWNERDEAD && mutex_state == LOCK)
		error_exit("Previous owning thread terminated");
	else if (EBUSY == status)
		error_exit("mutex is locked");
}

void	assign_forks_properly(t_philo *p, t_fork *forks)
{
	int	i;

	i = p->id - 1;
	p->left_fork = &forks[i];
	p->right_fork = &forks[(i + 1) % p->ptr->philo_nb];
}
