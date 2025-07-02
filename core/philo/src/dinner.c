/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   dinner.c                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/28 16:28:51 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 15:49:06 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "philosophers.h"

int	philo_died(t_philo *philo)
{
	long	elapsed;
	long	time_to_die;

	if (get_int(&philo->philo_mutex, &philo->full))
		return (0);
	elapsed = gettime(MILLISECONDS)
		- get_long(&philo->philo_mutex, &philo->last_meal_time);
	time_to_die = philo->ptr->time_to_die / 1000;
	if (elapsed > time_to_die)
	{
		set_int(&philo->ptr->table_mutex,
			&philo->ptr->end_simulation, 1);
		return (1);
	}
	return (0);
}

void	eat(t_philo *philo)
{
	int	left_id;
	int	right_id;

	left_id = philo->left_fork->fork_id;
	right_id = philo->right_fork->fork_id;
	if (left_id < right_id)
	{
		safe_mutex_handle(&philo->left_fork->fork, LOCK);
		write_status(TAKE_left_fork, philo, DEBUG_MODE);
		safe_mutex_handle(&philo->right_fork->fork, LOCK);
		write_status(TAKE_right_fork, philo, DEBUG_MODE);
	}
	else
	{
		safe_mutex_handle(&philo->right_fork->fork, LOCK);
		write_status(TAKE_right_fork, philo, DEBUG_MODE);
		safe_mutex_handle(&philo->left_fork->fork, LOCK);
		write_status(TAKE_left_fork, philo, DEBUG_MODE);
	}
	set_long(&philo->philo_mutex,
		&philo->last_meal_time, gettime(MILLISECONDS));
	write_status(EATING, philo, DEBUG_MODE);
	safe_mutex_handle(&philo->philo_mutex, LOCK);
	philo->meals_counter++;
	if (philo->ptr->max_meals > 0
		&& philo->meals_counter == philo->ptr->max_meals)
		philo->full = 1;
	safe_mutex_handle(&philo->philo_mutex, UNLOCK);
	precise_usleep(philo->ptr->time_to_eat, philo->ptr);
	if (left_id < right_id)
	{
		safe_mutex_handle(&philo->right_fork->fork, UNLOCK);
		safe_mutex_handle(&philo->left_fork->fork, UNLOCK);
	}
	else
	{
		safe_mutex_handle(&philo->left_fork->fork, UNLOCK);
		safe_mutex_handle(&philo->right_fork->fork, UNLOCK);
	}
}

void	thinking(t_philo *philo, bool pre_simulation)
{
	long	time_to_eat;
	long	time_to_sleep;
	long	time_to_think;

	if (!pre_simulation)
		write_status(THINKING, philo, DEBUG_MODE);
	if (philo->ptr->philo_nb % 2 == 0)
		return ;
	time_to_eat = philo->ptr->time_to_eat;
	time_to_sleep = philo->ptr->time_to_sleep;
	time_to_think = time_to_eat * 2 - time_to_sleep;
	if (time_to_think < 0)
		time_to_think = 0;
	precise_usleep(time_to_think * 0.42, philo->ptr);
	write_status(THINKING, philo, DEBUG_MODE);
}

void	*lone_philo(void *arg)
{
	t_philo	*philo;

	philo = (t_philo *)arg;
	wait_all_threads(philo->ptr);
	set_long(&philo->philo_mutex,
		&philo->last_meal_time, gettime(MILLISECONDS));
	increase_long(&philo->ptr->table_mutex, &philo->ptr->threads_running_nbr);
	while (!simulation_finished(philo->ptr))
		usleep(200);
	return (NULL);
}

void	*dinner_simulation(void *data)
{
	t_philo	*philo;

	philo = (t_philo *)data;
	set_long(&philo->philo_mutex,
		&philo->last_meal_time, gettime(MILLISECONDS));
	increase_long(&philo->ptr->table_mutex, &philo->ptr->threads_running_nbr);
	desynchronize_philos(philo);
	while (!simulation_finished(philo->ptr))
	{
		if (get_int(&philo->philo_mutex, &philo->full))
			break ;
		eat(philo);
		write_status(SLEEPING, philo, DEBUG_MODE);
		precise_usleep(philo->ptr->time_to_sleep, philo->ptr);
		thinking(philo, false);
	}
	return (NULL);
}

void	dinner_start(t_data *ptr)
{
	int	i;

	ptr->start_simulation = gettime(MILLISECONDS);
	i = 0;
	if (ptr->philo_nb == 1)
		safe_thread_handle(&ptr->philos[0].thread_id,
			lone_philo, &ptr->philos[0], CREATE);
	else
	{
		while (i < ptr->philo_nb)
		{
			safe_thread_handle(&ptr->philos[i].thread_id,
				dinner_simulation, &ptr->philos[i], CREATE);
			i++;
		}
	}
	safe_thread_handle(&ptr->monitor, monitor_dinner, ptr, CREATE);
	set_int(&ptr->table_mutex, &ptr->all_philos_ready, 1);
	i = 0;
	while (i < ptr->philo_nb)
	{
		safe_thread_handle(&ptr->philos[i].thread_id, NULL, NULL, JOIN);
		i++;
	}
	set_int(&ptr->table_mutex, &ptr->end_simulation, 1);
	safe_thread_handle(&ptr->monitor, NULL, NULL, JOIN);
}
