/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   synchronize.c                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/28 16:27:17 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 16:24:12 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "philosophers.h"

void	wait_all_threads(t_data *ptr)
{
	while (!get_int(&ptr->table_mutex, &ptr->all_philos_ready))
		;
}

void	check_threads_running(t_data *ptr)
{
	while (!all_threads_running(&ptr->table_mutex,
			&ptr->threads_running_nbr, ptr->philo_nb))
		usleep(1000);
}

void	*monitor_dinner(void *data)
{
	t_data	*ptr;

	ptr = (t_data *) data;
	check_threads_running(ptr);
	while (!simulation_finished(ptr))
	{
		if (check_philo_death(ptr))
			break ;
		if (ptr->max_meals > 0 && check_philos_full(ptr))
		{
			set_int(&ptr->table_mutex, &ptr->end_simulation, 1);
			break ;
		}
		usleep(1000);
	}
	return (NULL);
}

bool	all_threads_running(t_mutex *mutex, long *threads, long philo_nbr)
{
	bool	ret;

	ret = false;
	safe_mutex_handle(mutex, LOCK);
	if (*threads == philo_nbr)
		ret = true;
	safe_mutex_handle(mutex, UNLOCK);
	return (ret);
}

void	desynchronize_philos(t_philo *philo)
{
	if (philo->ptr->philo_nb % 2 == 0)
	{
		if (philo->id % 2 == 0)
			precise_usleep(3e4, philo->ptr);
	}
	else
	{
		if (philo->id % 2)
			thinking(philo, true);
	}
}
